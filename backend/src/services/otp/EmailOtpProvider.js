import nodemailer from 'nodemailer';

export class EmailOtpProvider {
  constructor() {
    this.transporter = null;
  }

  checkConfiguration() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    const missingKeys = [];
    if (!user) missingKeys.push('SMTP_USER (or EMAIL_USER)');
    if (!pass) missingKeys.push('SMTP_PASS (or EMAIL_PASS)');

    return {
      isConfigured: missingKeys.length === 0,
      missingKeys
    };
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    const configCheck = this.checkConfiguration();
    if (!configCheck.isConfigured) {
      throw new Error(
        `Email SMTP service is not configured. Missing required environment variables: ${configCheck.missingKeys.join(', ')}. Please configure your SMTP credentials in .env.`
      );
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const isGmail = (user || '').includes('@gmail.com') || host === 'smtp.gmail.com';
    this.transporter = nodemailer.createTransport({
      ...(isGmail ? { service: 'gmail' } : { host: host || 'smtp.gmail.com', port, secure }),
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    return this.transporter;
  }

  async sendOtp({ to, otp, purpose = 'Verification' }) {
    const transporter = this.getTransporter();
    const fromAddress = process.env.EMAIL_FROM || `"CandidateTrust Security" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;

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
          <h1>${purpose} Code</h1>
          <p>Hello,</p>
          <p>Please use the following single-use verification code to complete your verification:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 5 minutes. Do not share this code with anyone.</div>
          </div>

          <p>If you did not initiate this request, please ignore this email or contact security immediately.</p>
          
          <div class="footer">
            Candidate Trust & Fraud Intelligence System &bull; Zero-Trust Verification
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: `Your Verification Code: ${otp}`,
        text: `Your verification code is ${otp}. Valid for 5 minutes.`,
        html: htmlContent
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'Nodemailer SMTP'
      };
    } catch (err) {
      console.error('SMTP Email dispatch error:', err.message);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }
}

export const emailOtpProvider = new EmailOtpProvider();

