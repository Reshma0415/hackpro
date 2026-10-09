/**
 * Abstract Aadhaar Provider Base Class
 */
export class AadhaarProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Check if the provider has all required environment variables configured
   * @returns {{ isConfigured: boolean, missingKeys: string[] }}
   */
  checkConfiguration() {
    throw new Error('checkConfiguration() must be implemented by subclass');
  }

  /**
   * Generate & Dispatch Aadhaar OTP to user's registered mobile
   * @param {{ aadhaarNumber: string }} params
   * @returns {Promise<{ success: boolean, clientId: string, message: string, provider: string }>}
   */
  async generateOtp(params) {
    throw new Error('generateOtp() must be implemented by subclass');
  }

  /**
   * Verify Aadhaar OTP using Provider Verification API
   * @param {{ clientId: string, otp: string }} params
   * @returns {Promise<{ success: boolean, verified: boolean, last4: string, maskedAadhaar: string, details?: object, provider: string }>}
   */
  async verifyOtp(params) {
    throw new Error('verifyOtp() must be implemented by subclass');
  }
}

