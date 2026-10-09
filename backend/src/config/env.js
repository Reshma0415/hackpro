import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'candidate_trust_intelligence_super_secret_jwt_key_2026',
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DB_PATH: process.env.DB_PATH || './candidate_trust.sqlite',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/candidate_trust_db',
  
  // Nodemailer SMTP Real Email OTP Settings
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Candidate Trust Security <security@candidatetrust.local>',

  // Real Mobile SMS OTP Settings
  SMS_PROVIDER: (process.env.SMS_PROVIDER || 'twilio').toLowerCase(),
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || '',
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || '',
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',

  // Real Aadhaar KYC Settings (Surepass / Setu)
  AADHAAR_PROVIDER: (process.env.AADHAAR_PROVIDER || 'surepass').toLowerCase(),
  SUREPASS_API_KEY: process.env.SUREPASS_API_KEY || '',
  SUREPASS_API_URL: process.env.SUREPASS_API_URL || 'https://kyc-api.surepass.io',
  SETU_CLIENT_ID: process.env.SETU_CLIENT_ID || '',
  SETU_CLIENT_SECRET: process.env.SETU_CLIENT_SECRET || '',
  SETU_PRODUCT_INSTANCE_ID: process.env.SETU_PRODUCT_INSTANCE_ID || '',
  SETU_API_URL: process.env.SETU_API_URL || 'https://okyc.setu.co',

  // Ropes AI Threat Intelligence & IP Geolocation
  ROPES_AI_API_KEY: process.env.ROPES_AI_API_KEY || '',
  ROPES_AI_ENDPOINT: process.env.ROPES_AI_ENDPOINT || 'https://api.ropes.ai/v1',
  ROPES_AI_TIMEOUT_MS: parseInt(process.env.ROPES_AI_TIMEOUT_MS || '4000', 10),
  ROPES_AI_MOCK_FALLBACK: process.env.ROPES_AI_MOCK_FALLBACK !== 'false'
};

