import { TwilioVerifyProvider } from './TwilioVerifyProvider.js';
import { Msg91Provider } from './Msg91Provider.js';
import { Fast2SmsProvider } from './Fast2SmsProvider.js';

const providers = {
  twilio: new TwilioVerifyProvider(),
  msg91: new Msg91Provider(),
  fast2sms: new Fast2SmsProvider()
};

/**
 * Get active SMS Provider according to SMS_PROVIDER in .env
 * @returns {import('./OtpProvider.js').OtpProvider}
 */
export const getSmsProvider = () => {
  const chosen = (process.env.SMS_PROVIDER || 'twilio').toLowerCase().trim();
  const provider = providers[chosen];

  if (!provider) {
    const available = Object.keys(providers).join(', ');
    throw new Error(`Unsupported SMS_PROVIDER "${chosen}". Available providers: ${available}`);
  }

  return provider;
};

