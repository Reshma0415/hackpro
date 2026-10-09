import crypto from 'crypto';
import { config } from '../config/env.js';

// In-memory Phone OTP storage with cryptographic hashing: phone -> { hashedOtp, expiresAt, lastSentAt, attempts, verified }
const phoneOtpStore = new Map();

// Secret salt for server-side HMAC hashing
const OTP_SECRET = process.env.JWT_SECRET || 'candidate_trust_otp_salt_secret_2026';

/**
 * Format and validate Indian/International phone numbers
 */
export const formatPhoneNumber = (rawPhone) => {
  const digitsOnly = (rawPhone || '').replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    throw new Error('Invalid phone number. Please enter a valid 10-digit mobile number.');
  }

  // Extract last 10 digits for Indian mobile numbers
  const last10 = digitsOnly.slice(-10);
  const international = `+91${last10}`;

  return {
    raw: rawPhone,
    digitsOnly,
    last10,
    international
  };
};

/**
 * Helper to compute SHA-256 HMAC of OTP
 */
const hashOtp = (otp, phone) => {
  return crypto.createHmac('sha256', OTP_SECRET).update(`${phone}:${otp}`).digest('hex');
};

/**
 * Dispatch SMS via configured provider (Fast2SMS / Twilio / Custom Gateway)
 */
const dispatchSms = async (phoneInfo, otp) => {
  const messageBody = `Your CandidateTrust verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;

  // 1. Check Fast2SMS (Indian SMS Gateway)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2SmsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phoneInfo.last10
        })
      });
      const data = await response.json();
      if (data.return === true) {
        console.log(`📡 Fast2SMS OTP successfully dispatched to +91${phoneInfo.last10}`);
        return { success: true };
      } else {
        console.error('Fast2SMS error response:', data);
        throw new Error(data.message || 'Fast2SMS dispatch failed');
      }
    } catch (smsErr) {
      console.error('Fast2SMS gateway error:', smsErr.message);
      throw new Error('Unable to send OTP. Please check the phone number and try again.');
    }
  }

  // 2. Check Twilio SMS Gateway
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', phoneInfo.international);
      params.append('From', twilioFrom);
      params.append('Body', messageBody);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const twilioErr = await response.json();
        console.error('Twilio error:', twilioErr);
        throw new Error('Twilio dispatch failed');
      }

      console.log(`📡 Twilio SMS successfully dispatched to ${phoneInfo.international}`);
      return { success: true };
    } catch (twErr) {
      console.error('Twilio gateway error:', twErr.message);
      throw new Error('Unable to send OTP. Please check the phone number and try again.');
    }
  }

  // 3. Server-side log for local / testing when no SMS key is provided
  console.log(`=======================================================`);
  console.log(`📱 SMS OTP GENERATED FOR: ${phoneInfo.international}`);
  console.log(`🔑 SECURE OTP CODE (SERVER LOG ONLY): ${otp}`);
  console.log(`🔒 HASHED IN STORAGE: YES`);
  console.log(`=======================================================`);

  return { success: true };
};

/**
 * Generate secure 6-digit numerical OTP and send SMS
 */
export const sendPhoneOtp = async (rawPhone) => {
  const phoneInfo = formatPhoneNumber(rawPhone);
  const normalizedKey = phoneInfo.last10;
  const now = Date.now();

  // Rate Limiting & Cooldown Check (30 seconds cooldown between resends)
  const existing = phoneOtpStore.get(normalizedKey);
  if (existing && existing.lastSentAt) {
    const elapsedSeconds = Math.floor((now - existing.lastSentAt) / 1000);
    const cooldownSeconds = 30;
    if (elapsedSeconds < cooldownSeconds) {
      const waitTime = cooldownSeconds - elapsedSeconds;
      throw new Error(`Please wait ${waitTime} seconds before requesting a new OTP.`);
    }
  }

  // Generate cryptographically secure 6-digit numerical code
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(generatedOtp, normalizedKey);
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiry

  // Store hashed representation in secure memory
  phoneOtpStore.set(normalizedKey, {
    hashedOtp,
    expiresAt,
    lastSentAt: now,
    attempts: 0,
    verified: false
  });

  // Dispatch SMS
  await dispatchSms(phoneInfo, generatedOtp);

  // Return standard response WITHOUT exposing OTP value
  return {
    success: true,
    message: 'OTP sent to your number.'
  };
};

/**
 * Verify OTP entered by candidate
 */
export const verifyPhoneOtp = (rawPhone, inputOtp) => {
  const phoneInfo = formatPhoneNumber(rawPhone);
  const normalizedKey = phoneInfo.last10;
  const record = phoneOtpStore.get(normalizedKey);

  if (!record) {
    return {
      success: false,
      message: 'No OTP request found for this phone number. Please click "Send OTP" first.'
    };
  }

  if (Date.now() > record.expiresAt) {
    phoneOtpStore.delete(normalizedKey);
    return {
      success: false,
      message: 'The OTP code has expired. Please click "Resend OTP".'
    };
  }

  // Limit verification attempts to prevent brute-force attacks (max 5 attempts)
  if (record.attempts >= 5) {
    phoneOtpStore.delete(normalizedKey);
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new OTP.'
    };
  }

  record.attempts += 1;

  const cleanInput = (inputOtp || '').trim();
  const inputHash = hashOtp(cleanInput, normalizedKey);

  if (inputHash !== record.hashedOtp) {
    return {
      success: false,
      message: 'Invalid OTP code. Please enter the exact 6-digit code received on your phone.'
    };
  }

  // Mark as verified
  record.verified = true;
  return {
    success: true,
    message: 'Phone Verified ✓',
    verified: true
  };
};
