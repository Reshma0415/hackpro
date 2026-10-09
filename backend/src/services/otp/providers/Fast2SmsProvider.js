import { OtpProvider } from './OtpProvider.js';

export class Fast2SmsProvider extends OtpProvider {
  constructor() {
    super('Fast2SMS');
  }

  checkConfiguration() {
    const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;

    const missingKeys = [];
    if (!apiKey) missingKeys.push('FAST2SMS_API_KEY');

    return {
      isConfigured: missingKeys.length === 0,
      missingKeys
    };
  }

  async sendOtp({ to, otp }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(
        `Fast2SMS Provider is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please update your .env file.`
      );
    }

    const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
    const cleanNumber = to.replace(/\D/g, '').slice(-10); // Indian 10-digit number

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanNumber
        })
      });

      const result = await response.json();

      if (!result.return) {
        throw new Error(result.message || 'Fast2SMS dispatch failed');
      }

      return {
        success: true,
        messageId: result.request_id,
        provider: 'Fast2SMS'
      };
    } catch (err) {
      console.error('Fast2SMS delivery error:', err.message);
      throw new Error(`Fast2SMS delivery failed: ${err.message}`);
    }
  }
}

