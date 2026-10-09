import { AadhaarProvider } from './AadhaarProvider.js';

export class SetuAadhaarProvider extends AadhaarProvider {
  constructor() {
    super('Setu');
    this.clientId = process.env.SETU_CLIENT_ID || '';
    this.clientSecret = process.env.SETU_CLIENT_SECRET || '';
    this.productInstanceId = process.env.SETU_PRODUCT_INSTANCE_ID || '';
    this.baseUrl = process.env.SETU_BASE_URL || 'https://dg-sandbox.setu.co/api';
  }

  checkConfiguration() {
    const missingKeys = [];
    if (!this.clientId) missingKeys.push('SETU_CLIENT_ID');
    if (!this.clientSecret) missingKeys.push('SETU_CLIENT_SECRET');
    return {
      isConfigured: missingKeys.length === 0,
      missingKeys
    };
  }

  async generateOtp({ aadhaarNumber }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(`Setu OKYC API is not configured. Missing: ${configCheck.missingKeys.join(', ')}. Please add Setu credentials in .env.`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/okyc/`, {
        method: 'POST',
        headers: {
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret,
          'x-product-instance-id': this.productInstanceId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aadhaar_number: aadhaarNumber })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'ERROR') {
        throw new Error(data.message || 'Setu Aadhaar OTP request failed');
      }

      return {
        success: true,
        clientId: data.id || data.request_id,
        message: 'Aadhaar OTP sent via Setu to UIDAI registered mobile.',
        provider: this.name
      };
    } catch (err) {
      throw new Error(`Setu Provider Error: ${err.message}`);
    }
  }

  async verifyOtp({ clientId, otp }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(`Setu API is not configured. Missing: ${configCheck.missingKeys.join(', ')}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/okyc/${clientId}/verify`, {
        method: 'POST',
        headers: {
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret,
          'x-product-instance-id': this.productInstanceId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'SUCCESS') {
        throw new Error(data.message || 'Invalid or expired Aadhaar OTP code.');
      }

      const aadhaarInfo = data.data?.aadhaar || {};
      const last4 = aadhaarInfo.aadhaar_last_4 || 'XXXX';

      return {
        success: true,
        verified: true,
        last4,
        maskedAadhaar: `XXXX XXXX ${last4}`,
        details: {
          fullName: aadhaarInfo.full_name,
          dob: aadhaarInfo.dob,
          gender: aadhaarInfo.gender
        },
        provider: this.name
      };
    } catch (err) {
      throw new Error(`Setu Verification Error: ${err.message}`);
    }
  }
}

