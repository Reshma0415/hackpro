import crypto from 'crypto';
import { getSmsProvider } from './providers/providerFactory.js';
import { emailOtpProvider } from './EmailOtpProvider.js';
import { logAudit } from '../../middleware/audit.js';
import { config } from '../../config/env.js';

// In-memory secure OTP store: key -> { hashedOtp, expiresAt, attempts, lockedUntil, lastSentAt, resendTimestamps, channel, identifierMasked }
const otpStore = new Map();

// IP Rate Limiter Store: ip -> [timestamps]
const ipRateLimitStore = new Map();

const OTP_SECRET = process.env.JWT_SECRET || 'candidate_trust_otp_cryptographic_salt_2026';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_HOURLY_RESENDS = config.DEMO_MODE ? 30 : 3;
const MAX_VERIFICATION_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_IP_HOURLY_REQUESTS = config.DEMO_MODE ? 100 : 10;

/**
 * Validate and format phone number in strict E.164 format (+91XXXXXXXXXX)
 */
export const validateE164Phone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Phone number is required.');
  }

  const cleaned = rawPhone.trim().replace(/[\s-]/g, '');
  
  // Format Indian 10-digit number to E.164 (+91XXXXXXXXXX)
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If starts with 91 and 12 digits total
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Standard E.164 pattern (+ followed by country code and 9-14 digits)
  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error('Invalid phone number format. Please provide a valid number in E.164 format (e.g. +91XXXXXXXXXX).');
};

/**
 * Validate email address format
 */
export const validateEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') {
    throw new Error('Email address is required.');
  }
  const clean = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error('Please enter a valid email address.');
  }
  return clean;
};

/**
 * Mask identifier for audit logging and UI display
 */
const maskIdentifier = (identifier, channel) => {
  if (channel === 'EMAIL') {
    const [name, domain] = identifier.split('@');
    if (!name || !domain) return '***@***';
    const visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1);
    return `${visible}***@${domain}`;
  } else {
    // Phone
    return identifier.length > 4 ? `+***${identifier.slice(-4)}` : '***';
  }
};

/**
 * Generate cryptographic SHA-256 HMAC of OTP
 */
const hashOtp = (channel, identifier, otp) => {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${channel}:${identifier}:${otp}`)
    .digest('hex');
};

/**
 * Check IP Rate Limiting (max 10 requests per IP per hour)
 */
const checkIpRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  let timestamps = ipRateLimitStore.get(ip) || [];
  timestamps = timestamps.filter(t => t > windowStart);

  if (timestamps.length >= MAX_IP_HOURLY_REQUESTS) {
    throw new Error('Rate limit exceeded for your IP address. Please try again after one hour.');
  }

  timestamps.push(now);
  ipRateLimitStore.set(ip, timestamps);
};

export class OtpService {
  /**
   * Request / Send a real 6-digit OTP via Email or Mobile SMS
   */
  static async requestOtp({ channel, identifier, ip = '127.0.0.1', purpose = 'Authentication' }) {
    const normalizedChannel = channel === 'SMS' ? 'PHONE' : channel;
    if (!['EMAIL', 'PHONE'].includes(normalizedChannel)) {
      throw new Error('Invalid OTP channel. Must be EMAIL or PHONE.');
    }
    const finalChannel = normalizedChannel;

    const now = Date.now();
    let validatedIdentifier;

    if (channel === 'EMAIL') {
      validatedIdentifier = validateEmail(identifier);
    } else {
      validatedIdentifier = validateE164Phone(identifier);
    }

    const storeKey = `${channel}:${validatedIdentifier}`;
    const masked = maskIdentifier(validatedIdentifier, channel);

    // 1. Check IP rate limit
    checkIpRateLimit(ip);

    // 2. Check existing record for lockouts & cooldowns
    const existing = otpStore.get(storeKey);
    if (existing) {
      // Check 15-minute lock
      if (existing.lockedUntil && now < existing.lockedUntil) {
        const remainingMinutes = Math.ceil((existing.lockedUntil - now) / 60000);
        throw new Error(`Verification locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`);
      }

      // Check 60-second cooldown
      if (existing.lastSentAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
        throw new Error(`Please wait ${remainingSeconds} second(s) before requesting another OTP.`);
      }

      // Check max 3 resends per hour
      const oneHourAgo = now - 60 * 60 * 1000;
      const recentResends = (existing.resendTimestamps || []).filter(t => t > oneHourAgo);
      if (recentResends.length >= MAX_HOURLY_RESENDS) {
        throw new Error('Hourly OTP limit reached (maximum 3 resends per hour). Please try again after one hour.');
      }
    }

    // 3. Generate 6-digit numerical OTP with crypto.randomInt
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = hashOtp(channel, validatedIdentifier, rawOtp);
    const expiresAt = now + OTP_EXPIRY_MS;

    // 4. Update state in store
    const resendHistory = existing ? (existing.resendTimestamps || []).filter(t => t > now - 60 * 60 * 1000) : [];
    resendHistory.push(now);

    otpStore.set(storeKey, {
      hashedOtp,
      expiresAt,
      attempts: 0,
      lockedUntil: null,
      lastSentAt: now,
      resendTimestamps: resendHistory,
      channel,
      identifierMasked: masked,
      ip
    });

    // 5. Dispatch via real provider (or Sandbox Simulator in DEMO_MODE)
    let providerName = '';
    let isRealDelivered = false;

    try {
      if (finalChannel === 'EMAIL') {
        const configCheck = emailOtpProvider.checkConfiguration();
        if (configCheck.isConfigured) {
          const result = await emailOtpProvider.sendOtp({
            to: validatedIdentifier,
            otp: rawOtp,
            purpose
          });
          providerName = result.provider;
          isRealDelivered = true;
        } else if (config.DEMO_MODE) {
          providerName = 'Development Sandbox (Email)';
          isRealDelivered = false;
        } else {
          throw new Error(
            `Email SMTP service is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please configure your SMTP credentials in .env or enable DEMO_MODE=true in .env.`
          );
        }
      } else {
        const smsProvider = getSmsProvider();
        const configCheck = smsProvider.checkConfiguration();
        if (configCheck.isConfigured) {
          try {
            const result = await smsProvider.sendOtp({
              to: validatedIdentifier,
              otp: rawOtp,
              purpose
            });
            providerName = result.provider;
            isRealDelivered = true;
          } catch (smsErr) {
            console.warn(`[SMS Dispatch Notice] ${smsProvider.name} dispatch failed: ${smsErr.message}`);
            if (config.DEMO_MODE) {
              console.log(`[SMS Fallback] Using sandbox simulation because DEMO_MODE=true.`);
              providerName = `Sandbox (${smsProvider.name} gateway unavailable)`;
              isRealDelivered = false;
            } else {
              throw smsErr;
            }
          }
        } else if (config.DEMO_MODE) {
          providerName = 'Development Sandbox (SMS)';
          isRealDelivered = false;
        } else {
          throw new Error(
            `${smsProvider.name} SMS Provider is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please update your .env file or enable DEMO_MODE=true in .env.`
          );
        }
      }

      // Audit Log: NEVER log the plain OTP
      await logAudit({
        actorRole: 'CANDIDATE',
        actorEmail: finalChannel === 'EMAIL' ? validatedIdentifier : null,
        action: `OTP_SENT_${finalChannel}`,
        targetType: 'OTP_REQUEST',
        targetId: masked,
        ipAddress: ip,
        details: {
          channel: finalChannel,
          recipientMasked: masked,
          provider: providerName,
          expiresInSeconds: 300,
          isSandbox: !isRealDelivered
        }
      });

      return {
        success: true,
        message: isRealDelivered 
          ? (finalChannel === 'EMAIL' ? `OTP sent to your email (${masked}).` : `OTP sent to your number (${masked}).`)
          : `Sandbox OTP generated for ${masked}: ${rawOtp}`,
        cooldownSeconds: 60,
        expiresInSeconds: 300,
        channel: finalChannel,
        isRealDelivered,
        demoOtp: (!isRealDelivered && config.DEMO_MODE) ? rawOtp : undefined
      };
    } catch (dispatchErr) {
      // Clean up failed dispatch record
      otpStore.delete(storeKey);
      throw dispatchErr;
    }
  }

  /**
   * Verify real 6-digit OTP
   */
  static async verifyOtp({ channel, identifier, otp, ip = '127.0.0.1' }) {
    const finalChannel = channel === 'SMS' ? 'PHONE' : channel;
    if (!['EMAIL', 'PHONE'].includes(finalChannel)) {
      throw new Error('Invalid OTP channel.');
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      throw new Error('Please enter the exact 6-digit OTP code.');
    }

    let validatedIdentifier;
    if (finalChannel === 'EMAIL') {
      validatedIdentifier = validateEmail(identifier);
    } else {
      validatedIdentifier = validateE164Phone(identifier);
    }

    const storeKey = `${finalChannel}:${validatedIdentifier}`;
    const record = otpStore.get(storeKey);
    const masked = maskIdentifier(validatedIdentifier, finalChannel);
    const now = Date.now();

    if (!record) {
      throw new Error('No active OTP request found. Please click "Send OTP" first.');
    }

    // Check Lockout
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      throw new Error(`Account is locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`);
    }

    // Check Expiration
    if (now > record.expiresAt) {
      otpStore.delete(storeKey);
      await logAudit({
        actorRole: 'CANDIDATE',
        action: `OTP_EXPIRED_${channel}`,
        targetType: 'OTP_VERIFICATION',
        targetId: masked,
        ipAddress: ip,
        details: { channel, recipientMasked: masked }
      });
      throw new Error('The OTP code has expired. Please request a new OTP.');
    }

    // Validate Hash
    const cleanInput = otp.trim();
    const inputHash = hashOtp(channel, validatedIdentifier, cleanInput);

    if (inputHash !== record.hashedOtp) {
      record.attempts += 1;
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - record.attempts;

      if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_DURATION_MS;
        await logAudit({
          actorRole: 'CANDIDATE',
          action: `OTP_LOCKED_${channel}`,
          targetType: 'OTP_VERIFICATION',
          targetId: masked,
          ipAddress: ip,
          details: { channel, recipientMasked: masked, lockoutMinutes: 15 }
        });
        throw new Error('Maximum verification attempts exceeded. Verification locked for 15 minutes.');
      }

      await logAudit({
        actorRole: 'CANDIDATE',
        action: `OTP_FAILED_${channel}`,
        targetType: 'OTP_VERIFICATION',
        targetId: masked,
        ipAddress: ip,
        details: { channel, recipientMasked: masked, attempts: record.attempts }
      });

      throw new Error(`Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`);
    }

    // Invalidate OTP immediately upon successful verification
    otpStore.delete(storeKey);

    await logAudit({
      actorRole: 'CANDIDATE',
      actorEmail: channel === 'EMAIL' ? validatedIdentifier : null,
      action: `OTP_VERIFIED_SUCCESS_${channel}`,
      targetType: 'OTP_VERIFICATION',
      targetId: masked,
      ipAddress: ip,
      details: { channel, recipientMasked: masked }
    });

    return {
      success: true,
      message: `${channel === 'EMAIL' ? 'Email' : 'Phone'} Verified ✓`,
      verified: true,
      channel
    };
  }
}
