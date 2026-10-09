import { validateVerhoeff } from '../../utils/verhoeff.js';
import { SurepassAadhaarProvider } from './SurepassAadhaarProvider.js';
import { SetuAadhaarProvider } from './SetuAadhaarProvider.js';
import { logAudit } from '../../middleware/audit.js';
import { config } from '../../config/env.js';

// In-memory store for active Aadhaar verification sessions: clientId -> { maskedAadhaar, last4, createdAt, expiresAt }
const aadhaarSessionStore = new Map();
const aadhaarIpLimitStore = new Map();

const MAX_IP_HOURLY_AADHAAR = 8;
const SESSION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const checkAadhaarIpLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  let timestamps = aadhaarIpLimitStore.get(ip) || [];
  timestamps = timestamps.filter(t => t > windowStart);

  if (timestamps.length >= MAX_IP_HOURLY_AADHAAR) {
    throw new Error('Hourly Aadhaar verification request limit exceeded for your IP. Please try again after one hour.');
  }

  timestamps.push(now);
  aadhaarIpLimitStore.set(ip, timestamps);
};

export class AadhaarService {
  static getProvider() {
    const providerName = (process.env.AADHAAR_PROVIDER || 'surepass').toLowerCase();
    switch (providerName) {
      case 'setu':
        return new SetuAadhaarProvider();
      case 'surepass':
      default:
        return new SurepassAadhaarProvider();
    }
  }

  /**
   * Request Real Aadhaar OTP via licensed KYC provider
   */
  static async requestAadhaarOtp({ aadhaarNumber, ip = '127.0.0.1' }) {
    if (!aadhaarNumber || typeof aadhaarNumber !== 'string') {
      throw new Error('Aadhaar number is required.');
    }

    const clean = aadhaarNumber.replace(/[\s-]/g, '');

    // 1. Strict 12-Digit Format Check
    if (!/^\d{12}$/.test(clean)) {
      throw new Error('Aadhaar number must contain exactly 12 numerical digits.');
    }

    // 2. Strict Verhoeff Algorithm Checksum Validation
    const isChecksumValid = validateVerhoeff(clean);
    if (!isChecksumValid) {
      throw new Error('Invalid Aadhaar number. The 12-digit number failed the official Verhoeff checksum validation.');
    }

    // 3. IP Rate Limiting
    checkAadhaarIpLimit(ip);

    const last4 = clean.slice(-4);
    const masked = `XXXX XXXX ${last4}`;
    const provider = this.getProvider();
    const configCheck = provider.checkConfiguration();

    let clientId = '';
    let isReal = false;

    if (configCheck.isConfigured) {
      const result = await provider.generateOtp({ aadhaarNumber: clean });
      clientId = result.clientId;
      isReal = true;
    } else if (config.DEMO_MODE) {
      clientId = `sandbox_aadhaar_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      isReal = false;
    } else {
      throw new Error(
        `${provider.name} Aadhaar Provider is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please add your licensed Aadhaar API keys to your .env file or enable DEMO_MODE=true in .env.`
      );
    }

    // Store session in-memory (NEVER store the raw 12 digits)
    aadhaarSessionStore.set(clientId, {
      last4,
      maskedAadhaar: masked,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
      isReal
    });

    await logAudit({
      actorRole: 'CANDIDATE',
      action: 'AADHAAR_OTP_REQUESTED',
      targetType: 'AADHAAR_VERIFICATION',
      targetId: masked,
      ipAddress: ip,
      details: {
        provider: isReal ? provider.name : 'Development Sandbox KYC',
        maskedAadhaar: masked,
        clientId
      }
    });

    const devOtpCode = !isReal ? '749281' : undefined;

    return {
      success: true,
      clientId,
      message: isReal 
        ? `Aadhaar OTP sent successfully to mobile linked with UID ending in ${last4}.`
        : `[Dev Sandbox] Aadhaar OTP generated for UID ending in ${last4}. Verification Code: 749281`,
      last4,
      maskedAadhaar: masked,
      cooldownSeconds: 60,
      expiresInSeconds: 300,
      provider: isReal ? provider.name : 'Sandbox KYC',
      demoOtp: devOtpCode
    };
  }

  /**
   * Verify Real Aadhaar OTP via Provider API (or Sandbox verification)
   */
  static async verifyAadhaarOtp({ clientId, otp, ip = '127.0.0.1' }) {
    if (!clientId) {
      throw new Error('Transaction Client ID is required. Please request an Aadhaar OTP first.');
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      throw new Error('Please enter the complete 6-digit Aadhaar OTP.');
    }

    const session = aadhaarSessionStore.get(clientId);
    if (!session) {
      throw new Error('Aadhaar verification session expired or not found. Please request a new OTP.');
    }

    if (Date.now() > session.expiresAt) {
      aadhaarSessionStore.delete(clientId);
      throw new Error('Aadhaar OTP has expired. Please request a new OTP.');
    }

    let verificationResult = { success: true, details: null };

    if (session.isReal) {
      const provider = this.getProvider();
      verificationResult = await provider.verifyOtp({ clientId, otp: otp.trim() });
    } else {
      // Sandbox validation: accepts any 6-digit code or 749281
      if (otp.trim().length !== 6) {
        throw new Error('Invalid OTP code. Must be 6 digits.');
      }
    }

    // Clean up session
    aadhaarSessionStore.delete(clientId);

    await logAudit({
      actorRole: 'CANDIDATE',
      action: 'AADHAAR_OTP_VERIFIED_SUCCESS',
      targetType: 'AADHAAR_VERIFICATION',
      targetId: session.maskedAadhaar,
      ipAddress: ip,
      details: {
        provider: session.isReal ? this.getProvider().name : 'Development Sandbox KYC',
        maskedAadhaar: session.maskedAadhaar,
        last4: session.last4
      }
    });

    return {
      success: true,
      verified: true,
      message: 'Aadhaar Verified Successfully ✓',
      last4: session.last4,
      maskedAadhaar: session.maskedAadhaar,
      details: verificationResult.details || null,
      provider: session.isReal ? this.getProvider().name : 'Development Sandbox'
    };
  }
}

