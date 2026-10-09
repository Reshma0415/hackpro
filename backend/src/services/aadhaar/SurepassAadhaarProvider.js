import { AadhaarProvider } from './AadhaarProvider.js';

export class SurepassAadhaarProvider extends AadhaarProvider {
  constructor() {
    super('Surepass');
    this.apiKey = process.env.SUREPASS_API_KEY || '';
    this.baseUrl = process.env.SUREPASS_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
  }

  checkConfiguration() {
    const missingKeys = [];
    if (!this.apiKey) missingKeys.push('SUREPASS_API_KEY');
    return {
      isConfigured: missingKeys.length === 0,
      missingKeys
    };
  }

  async generateOtp({ aadhaarNumber }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(`Surepass API is not configured. Missing: ${configCheck.missingKeys.join(', ')}. Please add your Surepass API Key in .env.`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/aadhaar-v2/generate-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_number: aadhaarNumber })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Surepass Aadhaar OTP request failed');
      }

      return {
        success: true,
        clientId: data.data.client_id,
        otpSent: data.data.otp_sent,
        message: 'Aadhaar OTP sent successfully to UIDAI registered mobile number.',
        provider: this.name
      };
    } catch (err) {
      throw new Error(`Surepass Provider Error: ${err.message}`);
    }
  }

  async verifyOtp({ clientId, otp }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(`Surepass API is not configured. Missing: ${configCheck.missingKeys.join(', ')}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/aadhaar-v2/submit-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id: clientId, otp })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired Aadhaar OTP code.');
      }

      const aadhaarData = data.data || {};
      const fullAadhaar = aadhaarData.aadhaar_number || '';
      const last4 = fullAadhaar ? fullAadhaar.slice(-4) : (aadhaarData.last_four || 'XXXX');

      return {
        success: true,
        verified: true,
        last4,
        maskedAadhaar: `XXXX XXXX ${last4}`,
        details: {
          fullName: aadhaarData.full_name,
          dob: aadhaarData.dob,
          gender: aadhaarData.gender,
          careOf: aadhaarData.care_of,
          state: aadhaarData.address?.state,
          pincode: aadhaarData.zip
        },
        provider: this.name
      };
    } catch (err) {
      throw new Error(`Surepass Verification Error: ${err.message}`);
    }
  }
}

