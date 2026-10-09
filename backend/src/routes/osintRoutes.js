import express from 'express';
import { OsintService } from '../services/osint/osintService.js';
import { RopesAiService } from '../services/ropesAi/RopesAiService.js';
import { config } from '../config/env.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * POST /api/osint/scan
 * Comprehensive 360° OSINT Investigation (Email, Phone, GitHub, LeetCode, LinkedIn, IP & Ropes AI Location)
 */
router.post('/scan', async (req, res) => {
  try {
    const { email, phone, github, leetcode, linkedin, name, gps, clientTimezone } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const report = await OsintService.runFullOsintScan({
      email,
      phone,
      github,
      leetcode,
      linkedin,
      name,
      ip: clientIp,
      gps,
      clientTimezone
    });

    await logAudit({
      actorRole: 'HR_SECURITY_ADMIN',
      action: 'OSINT_SCAN_EXECUTED',
      targetType: 'OSINT_INVESTIGATION',
      targetId: email || phone || github || leetcode || linkedin || 'manual_query',
      ipAddress: clientIp,
      details: {
        compositeScore: report.compositeScore,
        overallRiskLevel: report.overallRiskLevel,
        flagsCount: report.allFlags.length
      }
    });

    return res.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('OSINT scan error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete OSINT scan: ' + err.message
    });
  }
});

/**
 * POST /api/osint/email
 */
router.post('/email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const result = await OsintService.scanEmail(email);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/osint/phone
 */
router.post('/phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const result = OsintService.scanPhone(phone);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/osint/github
 */
router.post('/github', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'GitHub username is required' });
    }
    const result = await OsintService.scanGithub(username);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/osint/leetcode
 */
router.post('/leetcode', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'LeetCode username is required' });
    }
    const result = await OsintService.scanLeetCode(username);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/osint/linkedin
 */
router.post('/linkedin', async (req, res) => {
  try {
    const { input, name } = req.body;
    if (!input) {
      return res.status(400).json({ success: false, message: 'LinkedIn URL or handle is required' });
    }
    const result = OsintService.scanLinkedIn(input, name);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/osint/ropes-ai/ip (or POST /api/osint/ip)
 * Live Ropes AI IP Geolocation, VPN/Proxy Detection, ASN, and Threat Scoring
 */
router.post(['/ropes-ai/ip', '/ip'], async (req, res) => {
  try {
    const targetIp = req.body.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const result = await RopesAiService.scanIp(targetIp);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/osint/ropes-ai/analyze-location
 * Analyzes IP Geolocation vs Browser Timezone vs Optional Permissioned GPS
 */
router.post('/ropes-ai/analyze-location', async (req, res) => {
  try {
    const { ip, clientTimezone, gps, previousLocation } = req.body;
    const targetIp = ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ipScanResult = await RopesAiService.scanIp(targetIp);
    
    const analysis = RopesAiService.analyzeLocation({
      ipScanResult,
      clientTimezone: clientTimezone || 'Asia/Kolkata',
      gpsData: gps || null,
      previousLocation
    });

    return res.json({ success: true, data: analysis });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/osint/ropes-ai/status
 * Health & Integration status for Ropes AI Threat Intelligence
 */
router.get('/ropes-ai/status', (req, res) => {
  return res.json({
    success: true,
    provider: 'Ropes AI',
    status: 'ACTIVE',
    mode: config.ROPES_AI_API_KEY ? 'LIVE_API' : 'INTELLIGENT_ENGINE',
    endpoint: config.ROPES_AI_ENDPOINT,
    hasApiKey: !!config.ROPES_AI_API_KEY,
    capabilities: [
      'IP Geolocation (City, Region, Country, Coordinates)',
      'VPN & Commercial Proxy Detection',
      'Tor Exit Node Identification',
      'Datacenter & Cloud Hosting Subnet Flagging',
      'Permission-based GPS Drift Analysis (Optional)',
      'Browser Timezone vs IP Timezone Verification',
      'Impossible Travel Velocity Anomaly Detection',
      'Zero Single-Signal Auto-Fraud Disqualification Guardrail'
    ],
    guardrail: {
      humanReviewEnforced: true,
      singleSignalProtection: true,
      gpsOptionalPolicy: 'Permission-based with zero penalty for opt-out'
    }
  });
});

export default router;

