import { OtpProvider } from './OtpProvider.js';

export class TwilioVerifyProvider extends OtpProvider {
  constructor() {
    super('Twilio');
  }

  checkConfiguration() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const phone = process.env.TWILIO_PHONE_NUMBER;
    const serviceSid = process.env.TWILIO_SERVICE_SID;

    const missingKeys = [];
    if (!sid) missingKeys.push('TWILIO_ACCOUNT_SID');
    if (!auth) missingKeys.push('TWILIO_AUTH_TOKEN');
    if (!phone && !serviceSid) missingKeys.push('TWILIO_PHONE_NUMBER or TWILIO_SERVICE_SID');

    return {
      isConfigured: missingKeys.length === 0,
      missingKeys
    };
  }

  async sendOtp({ to, otp, purpose = 'Verification' }) {
    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(
        `Twilio SMS Provider is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please update your .env file.`
      );
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const authHeader = 'Basic ' + Buffer.from(`${sid}:${auth}`).toString('base64');

    const messageBody = `Your CandidateTrust security verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;

    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', fromPhone);
    params.append('Body', messageBody);

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Twilio SMS API Error:', result);
        throw new Error(result.message || 'Twilio SMS dispatch failed');
      }

      return {
        success: true,
        messageId: result.sid,
        provider: 'Twilio'
      };
    } catch (err) {
      console.error('Twilio SMS delivery error:', err.message);
      throw new Error(`Twilio SMS delivery failed: ${err.message}`);
    }
  }
}

