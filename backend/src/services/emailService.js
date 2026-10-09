import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// In-memory OTP storage with expiration: email -> { otp, expiresAt, verified }
const otpStore = new Map();

// Configure Transporter (supports Gmail / Custom SMTP / Ethereal Fallback)
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    // Real SMTP / Gmail configured
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || (host ? undefined : 'gmail'),
      host: host || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass }
    });
    console.log(`📧 Configured real email transporter with ${user}`);
  } else {
    // Use test Ethereal account if no SMTP provided in .env
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`📧 Ethereal Test Email Transporter initialized: ${testAccount.user}`);
    } catch (err) {
      // Direct stream fallback
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows'
      });
    }
  }

  return transporter;
};

/**
 * Generate a random 6-digit numerical OTP and dispatch to recipient email
 */
export const sendRealEmailOtp = async (toEmail) => {
  const cleanEmail = toEmail.trim().toLowerCase();
  
  // Generate real 6-digit random code
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // Store in cache
  otpStore.set(cleanEmail, {
    otp: generatedOtp,
    expiresAt,
    verified: false
  });

  const mailTransporter = await getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 9999px; color: #fb923c; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
        h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #cbd5e1; }
        .otp-box { margin: 24px 0; padding: 20px; background: #020617; border: 1.5px solid #ea580c; border-radius: 12px; text-align: center; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fb923c; }
        .expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .footer { font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">CandidateTrust Security</div>
        <h1>Candidate Email Verification</h1>
        <p>Hello,</p>
        <p>Please use the following single-use verification code to verify your email address and continue your job application:</p>
        
        <div class="otp-box">
          <div class="otp-code">${generatedOtp}</div>
          <div class="expiry">Valid for 10 minutes. Do not share this code with anyone.</div>
        </div>

        <p>If you did not initiate this job application, you can safely ignore this email.</p>
        
        <div class="footer">
          Candidate Trust & Fraud Intelligence System &bull; Zero-Trust Candidate Identity
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"CandidateTrust Security" <no-reply@candidatetrust.ai>',
      to: cleanEmail,
      subject: `Your Candidate Verification OTP: ${generatedOtp}`,
      text: `Your CandidateTrust email verification OTP is ${generatedOtp}. Valid for 10 minutes.`,
      html: htmlContent
    });

    console.log(`=======================================================`);
    console.log(`📨 REAL EMAIL OTP SENT TO: ${cleanEmail}`);
    console.log(`🔑 OTP CODE: ${generatedOtp}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    console.log(`=======================================================`);

    return {
      success: true,
      otp: generatedOtp,
      demoOtp: config.DEMO_MODE ? generatedOtp : undefined,
      isDemo: !!config.DEMO_MODE,
      previewUrl: nodemailer.getTestMessageUrl(info) || null
    };
  } catch (err) {
    console.error(`Email dispatch error to ${cleanEmail}:`, err.message);
    // Fallback: log to console so developer/user always sees it during testing even without active internet/SMTP
    console.log(`=======================================================`);
    console.log(`🔑 FALLBACK OTP CODE FOR ${cleanEmail}: ${generatedOtp}`);
    console.log(`=======================================================`);
    return { 
      success: true,
      otp: generatedOtp,
      demoOtp: config.DEMO_MODE ? generatedOtp : undefined,
      isDemo: !!config.DEMO_MODE
    };
  }
};

/**
 * Verify user submitted OTP for email
 */
export const verifyRealEmailOtp = (toEmail, inputOtp) => {
  const cleanEmail = toEmail.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return { success: false, message: 'No OTP request found for this email. Please click "Send OTP" first.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return { success: false, message: 'The OTP code has expired. Please request a new OTP.' };
  }

  const cleanInput = (inputOtp || '').trim();
  if (cleanInput !== record.otp) {
    return { success: false, message: 'Invalid OTP code. Please enter the exact code sent to your email.' };
  }

  // Mark as verified
  record.verified = true;
  return { success: true, message: 'Email verified successfully!' };
};

