import { OtpProvider } from './OtpProvider.js';

export class Msg91Provider extends OtpProvider {
  constructor() {
    super('MSG91');
  }

  checkConfiguration() {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    const missingKeys = [];
    if (!authKey) missingKeys.push('MSG91_AUTH_KEY');
    if (!templateId) missingKeys.push('MSG91_TEMPLATE_ID');

    return {
      isConfigured: missingKeys.length === 0,
      missingKeys
    };
  }

  async sendOtp({ to, otp }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(
        `MSG91 Provider is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please update your .env file.`
      );
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const cleanNumber = to.replace(/\D/g, ''); // E.164 digits without +

    try {
      const response = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanNumber}&otp=${otp}`, {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.type === 'error') {
        throw new Error(result.message || 'MSG91 OTP dispatch failed');
      }

      return {
        success: true,
        messageId: result.request_id || result.message,
        provider: 'MSG91'
      };
    } catch (err) {
      console.error('MSG91 delivery error:', err.message);
      throw new Error(`MSG91 delivery failed: ${err.message}`);
    }
  }
}

