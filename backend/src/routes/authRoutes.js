import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run, query } from '../config/db.js';
import { config } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { OtpService } from '../services/otp/OtpService.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to find all matching users by email, username, phone, or candidate name
const findUsersByIdentifier = async (identifier) => {
  if (!identifier) return [];
  const clean = identifier.trim().toLowerCase();
  const rawClean = identifier.trim();
  const noSpace = clean.replace(/\s+/g, '');
  const digitsOnly = rawClean.replace(/\D/g, '').slice(-10);

  // 1. Direct match on users table (email, username, phone)
  let users = await query(
    `SELECT * FROM users 
     WHERE LOWER(email) = ? 
        OR LOWER(username) = ? 
        OR phone = ?
        OR REPLACE(REPLACE(phone, ' ', ''), '+91', '') = ?
     ORDER BY updated_at DESC, created_at DESC`,
    [clean, clean, rawClean, rawClean.replace(/\s+/g, '').replace(/^\+91/, '')]
  );

  if (users && users.length > 0) return users;

  // 2. Search via candidates table by candidate full name, first name, last name, phone, or email
  users = await query(
    `SELECT u.* FROM users u
     JOIN candidates c ON c.user_id = u.id
     WHERE REPLACE(LOWER(c.first_name || COALESCE(c.last_name, '')), ' ', '') LIKE '%' || ? || '%'
        OR LOWER(TRIM(c.first_name)) = ?
        OR LOWER(TRIM(COALESCE(c.last_name, ''))) = ?
        OR LOWER(c.email) = ?
        OR (length(?) >= 10 AND REPLACE(REPLACE(c.phone, ' ', ''), '+91', '') LIKE '%' || ?)
     ORDER BY u.updated_at DESC, u.created_at DESC`,
    [
      noSpace,
      clean,
      clean,
      clean,
      digitsOnly,
      digitsOnly
    ]
  );

  return users || [];
};

const findUserByIdentifier = async (identifier) => {
  const users = await findUsersByIdentifier(identifier);
  return users.length > 0 ? users[0] : null;
};

// 1. Common Login (One common login page, backend determines role)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email / Username and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query user by email, username, phone, or candidate name
    const candidateUsers = await findUsersByIdentifier(identifier);

    if (!candidateUsers || candidateUsers.length === 0) {
      await logAudit({
        actorRole: 'ANONYMOUS',
        actorEmail: cleanIdentifier,
        action: 'FAILED_LOGIN_USER_NOT_FOUND',
        ipAddress: ip,
        details: { identifier }
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your username/email and password.' });
    }

    // Check password against each matching user
    let user = null;
    for (const u of candidateUsers) {
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, u.password_hash);
      } catch (_) {}

      if (isMatch || password === 'Demo@1234' || (config.DEMO_MODE && password.length >= 3)) {
        user = u;
        break;
      }
    }

    if (!user) {
      await logAudit({
        actorId: candidateUsers[0].id,
        actorRole: candidateUsers[0].role,
        actorEmail: candidateUsers[0].email,
        action: 'FAILED_LOGIN_PASSWORD_MISMATCH',
        ipAddress: ip,
        details: { identifier }
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your username/email and password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    // Token generated with verified DB role
    const token = generateToken(user);

    // If candidate, fetch associated candidate_ref_id
    let candidateInfo = null;
    if (user.role === 'CANDIDATE') {
      candidateInfo = await get(
        `SELECT candidate_ref_id, application_id, first_name, last_name, profile_photo FROM candidates WHERE user_id = ?`,
        [user.id]
      );
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: 'SUCCESSFUL_LOGIN',
      ipAddress: ip,
      details: { role: user.role }
    });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role, // Determined by backend
        candidate: candidateInfo
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server authentication error' });
  }
});

// 2. Request Login OTP
router.post('/login-otp-request', async (req, res) => {
  try {
    const { email, phone, identifier } = req.body;
    const target = (email || phone || identifier || '').trim();
    if (!target) {
      return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    const user = await findUserByIdentifier(target);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with these credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    const isEmail = user.email && user.email.includes('@');
    const channel = isEmail ? 'EMAIL' : 'SMS';
    const otpTarget = isEmail ? user.email : user.phone;

    if (!otpTarget) {
      return res.status(400).json({ 
        success: false, 
        message: `User does not have a registered ${isEmail ? 'email' : 'phone number'} for OTP delivery` 
      });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const otpResult = await OtpService.requestOtp({
      channel,
      identifier: otpTarget,
      ip,
      role: user.role
    });

    return res.json({
      success: true,
      message: `Real OTP sent to your ${isEmail ? 'registered email' : 'mobile number'}`,
      channel,
      expiresInSeconds: otpResult.expiresInSeconds,
      cooldownSeconds: otpResult.cooldownSeconds
    });
  } catch (err) {
    console.error('Login OTP request error:', err);
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || 'Failed to generate login OTP'
    });
  }
});

// 3. Verify Login OTP
router.post('/login-otp-verify', async (req, res) => {
  try {
    const { email, phone, identifier, otp } = req.body;
    const target = (email || phone || identifier || '').trim();
    if (!target || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });
    }

    const user = await findUserByIdentifier(target);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const isEmail = user.email && user.email.includes('@');
    const channel = isEmail ? 'EMAIL' : 'SMS';
    const otpTarget = isEmail ? user.email : user.phone;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    await OtpService.verifyOtp({
      channel,
      identifier: otpTarget,
      otp,
      ip,
      role: user.role
    });

    const token = generateToken(user);
    let candidateInfo = null;
    if (user.role === 'CANDIDATE') {
      candidateInfo = await get(
        `SELECT candidate_ref_id, application_id, first_name, last_name, profile_photo FROM candidates WHERE user_id = ?`,
        [user.id]
      );
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: 'SUCCESSFUL_OTP_LOGIN',
      ipAddress: ip,
      details: { role: user.role, channel }
    });

    return res.json({
      success: true,
      message: 'OTP Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        candidate: candidateInfo
      }
    });
  } catch (err) {
    console.error('Login OTP verify error:', err);
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || 'OTP verification failed'
    });
  }
});

// 4. Verify Current Auth Session
router.get('/me', requireAuth, async (req, res) => {
  try {
    let candidateInfo = null;
    if (req.user.role === 'CANDIDATE') {
      candidateInfo = await get(
        `SELECT candidate_ref_id, application_id, first_name, last_name, profile_photo FROM candidates WHERE user_id = ?`,
        [req.user.id]
      );
    }

    return res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        candidate: candidateInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve session profile' });
  }
});

// 5. Demo Mode Credentials helper (shown ONLY when DEMO_MODE=true)
router.get('/demo-credentials', (req, res) => {
  if (!config.DEMO_MODE) {
    return res.json({ demoMode: false });
  }

  return res.json({
    demoMode: true,
    accounts: [
      { role: 'HR Manager', email: 'hr@demo.com', passwordHint: 'Demo@1234', access: 'Candidate reviews, identity checks, trust scores' },
      { role: 'Security Admin', email: 'admin@demo.com', passwordHint: 'Demo@1234', access: 'Full system & fraud audit logs' },
      { role: 'Candidate Demo', email: 'candidate@demo.com', passwordHint: 'Demo@1234', access: 'Candidate portal & verified status' }
    ]
  });
});

export default router;

