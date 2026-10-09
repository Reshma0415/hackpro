/**
 * Base abstract class for SMS OTP Providers
 */
export class OtpProvider {
  constructor(name) {
    if (new.target === OtpProvider) {
      throw new TypeError('Cannot construct OtpProvider instances directly.');
    }
    this.name = name;
  }

  /**
   * Check if the provider has all required credentials configured
   * @returns {{ isConfigured: boolean, missingKeys: string[] }}
   */
  checkConfiguration() {
    throw new Error('Method checkConfiguration() must be implemented.');
  }

  /**
   * Send SMS OTP to recipient
   * @param {{ to: string, otp: string, purpose: string }} params
   * @returns {Promise<{ success: boolean, messageId?: string, provider: string }>}
   */
  async sendOtp(params) {
    throw new Error('Method sendOtp() must be implemented.');
  }

  getName() {
    return this.name;
  }
}

