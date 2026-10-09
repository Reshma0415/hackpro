import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { AssessmentSecurityEvent } from '../models/AssessmentSecurityEvent.js';
import { Notification } from '../models/Notification.js';
import { CandidateApplication } from '../models/CandidateApplication.js';
import { getMongoStatus } from '../config/mongo.js';
import { config } from '../config/env.js';

const router = express.Router();
router.use(requireAuth);

// Ensure recordings upload directory exists
const recordingsDir = path.resolve(config.UPLOAD_DIR, 'recordings');
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recordingsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  }
});
const recordingUpload = multer({ storage: recordingStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// Helper: Check if current time is within scheduled window
const isWithinAssessmentWindow = (scheduledDate, startTimeStr, endTimeStr) => {
  try {
    const now = new Date();
    const [year, month, day] = scheduledDate.split('-').map(Number);
    
    // Parse start time (e.g., "10:00 AM" or "10:00")
    const parseTime = (timeStr, baseDate) => {
      const d = new Date(baseDate);
      const isPM = /pm/i.test(timeStr);
      const isAM = /am/i.test(timeStr);
      const cleanTime = timeStr.replace(/am|pm/i, '').trim();
      const [rawHours, rawMins] = cleanTime.split(':').map(Number);
      let hours = rawHours;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      d.setHours(hours, rawMins || 0, 0, 0);
      return d;
    };

    const targetBaseDate = new Date(year, month - 1, day);
    const windowStart = parseTime(startTimeStr, targetBaseDate);
    const windowEnd = parseTime(endTimeStr, targetBaseDate);

    // In demo mode or same day testing, allow flexible start if test is active
    if (config.DEMO_MODE) {
      return { inWindow: true, windowStart, windowEnd };
    }

    const inWindow = now >= windowStart && now <= windowEnd;
    return { inWindow, windowStart, windowEnd };
  } catch (err) {
    return { inWindow: true };
  }
};

// 1. Get Assessment Info & Check Window
router.get('/:assessmentId/check-window', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const asm = await get(
      `SELECT * FROM assessments WHERE id = ? OR assessment_id = ?`,
      [assessmentId, assessmentId]
    );

    if (!asm) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const windowCheck = isWithinAssessmentWindow(asm.scheduled_date, asm.window_start_time, asm.window_end_time);

    return res.json({
      success: true,
      assessmentId: asm.assessment_id,
      title: asm.title,
      scheduledDate: asm.scheduled_date,
      windowStartTime: asm.window_start_time,
      windowEndTime: asm.window_end_time,
      durationMinutes: asm.duration_minutes,
      inWindow: windowCheck.inWindow,
      instructions: asm.instructions,
      policy: asm.policy_data ? JSON.parse(asm.policy_data) : {
        maxTabSwitches: 3,
        maxVoiceWarnings: 3,
        maxNetworkInterruptions: 3,
        maxFullscreenExits: 3,
        recoveryWindowMinutes: 3
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify assessment window' });
  }
});

// 2. Start Assessment Attempt (Pre-checks passed)
router.post('/:assessmentId/start', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { preCheckPassed, cameraReady, micReady, networkStable, fullscreenReady } = req.body;

    if (!cameraReady || !micReady || !networkStable || !fullscreenReady) {
      return res.status(400).json({
        success: false,
        message: 'Pre-assessment system requirements not satisfied. Camera, Microphone, Network, and Fullscreen are required.'
      });
    }

    const asm = await get(
      `SELECT * FROM assessments WHERE id = ? OR assessment_id = ?`,
      [assessmentId, assessmentId]
    );

    if (!asm) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const cand = await get(`SELECT c.*, a.resume_analysis FROM candidates c LEFT JOIN applications a ON c.application_id = a.id WHERE c.user_id = ? OR c.email = ?`, [req.user.id, req.user.email]);
    const candidateId = cand?.candidate_ref_id || 'CT-2026-DEMO';
    const candidateName = cand ? `${cand.first_name || ''} ${cand.last_name || ''}`.trim() : req.user.username;

    // Enforce Workflow Requirement: Complete Resume Analysis before Assessment
    let hasCompletedResumeAnalysis = false;
    if (cand?.resume_analysis) {
      hasCompletedResumeAnalysis = true;
    } else {
      try {
        if (getMongoStatus()) {
          const mApp = await CandidateApplication.findOne({ $or: [{ candidateId }, { email: req.user.email }] });
          if (mApp?.resumeData || mApp?.resumeAnalysis) {
            hasCompletedResumeAnalysis = true;
          }
        }
      } catch (e) {}
    }

    if (!hasCompletedResumeAnalysis && !config.DEMO_MODE) {
      return res.status(403).json({
        success: false,
        message: 'Complete Resume Analysis to continue. Assessment is locked until your resume extraction and verification stage is complete.'
      });
    }

    // Check for existing active attempt
    const existingAttempt = await get(
      `SELECT * FROM assessment_attempts WHERE assessment_id = ? AND candidate_id = ? AND status = 'IN_PROGRESS'`,
      [asm.id, candidateId]
    );

    let attemptId;
    let durationSeconds = (asm.duration_minutes || 60) * 60;
    let questions = asm.questions_data ? JSON.parse(asm.questions_data) : [];

    // Strip answers from questions payload sent to candidate
    const sanitizedQuestions = questions.map(({ correctOption, explanation, ...rest }) => rest);

    if (existingAttempt) {
      attemptId = existingAttempt.attempt_id;
      durationSeconds = existingAttempt.remaining_seconds || durationSeconds;
    } else {
      attemptId = `ATT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const sqlAttemptId = uuidv4();
      
      const initialWarnings = JSON.stringify({
        tabSwitches: 0,
        fullscreenExits: 0,
        voiceDetections: 0,
        networkInterruptions: 0,
        copyPasteAttempts: 0
      });

      await run(
        `INSERT INTO assessment_attempts (
          id, attempt_id, assessment_id, candidate_id, user_id, candidate_name, candidate_email,
          status, remaining_seconds, total_points, warning_counts, security_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', ?, ?, ?, 'Verified')`,
        [
          sqlAttemptId,
          attemptId,
          asm.id,
          candidateId,
          req.user.id,
          candidateName,
          req.user.email,
          durationSeconds,
          questions.length * 10,
          initialWarnings
        ]
      );

      // Dual Save in MongoDB if active
      try {
        if (getMongoStatus()) {
          await AssessmentAttempt.create({
            attemptId,
            assessmentId: asm.assessment_id,
            candidateId,
            userId: req.user.id,
            candidateName,
            candidateEmail: req.user.email,
            status: 'IN_PROGRESS',
            remainingSeconds: durationSeconds,
            totalPoints: questions.length * 10
          });
        }
      } catch (mErr) {}

      await logAudit({
        actorId: req.user.id,
        actorRole: 'CANDIDATE',
        actorEmail: req.user.email,
        action: 'ASSESSMENT_STARTED',
        targetType: 'ASSESSMENT_ATTEMPT',
        targetId: attemptId,
        details: { assessmentId: asm.assessment_id, candidateId }
      });
    }

    return res.json({
      success: true,
      message: 'Assessment session started successfully',
      attemptId,
      assessment: {
        assessmentId: asm.assessment_id,
        title: asm.title,
        jobRole: asm.job_role,
        durationMinutes: asm.duration_minutes,
        durationSeconds,
        questions: sanitizedQuestions,
        totalQuestions: sanitizedQuestions.length,
        policy: asm.policy_data ? JSON.parse(asm.policy_data) : {
          maxTabSwitches: 3,
          maxVoiceWarnings: 3,
          maxNetworkInterruptions: 3,
          maxFullscreenExits: 3,
          recoveryWindowMinutes: 3
        }
      }
    });
  } catch (err) {
    console.error('Start assessment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initiate secure assessment session' });
  }
});

// 3. Log Real-time Proctoring Security Event (Tab Switch, Face, Voice, Camera/Mic, Copy-Paste)
router.post('/attempts/:attemptId/event', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { eventType, severity = 'MEDIUM', metadata = {} } = req.body;

    const attempt = await get(`SELECT * FROM assessment_attempts WHERE attempt_id = ? OR id = ?`, [attemptId, attemptId]);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found' });
    }

    const eventId = `EVT-${Date.now()}-${uuidv4().slice(0, 6)}`;
    const sqlEventId = uuidv4();

    await run(
      `INSERT INTO assessment_security_events (id, event_id, attempt_id, candidate_id, assessment_id, event_type, severity, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sqlEventId,
        eventId,
        attempt.id,
        attempt.candidate_id,
        attempt.assessment_id,
        eventType,
        severity,
        JSON.stringify(metadata)
      ]
    );

    // Update attempt warning counts & security summary
    const warningCounts = attempt.warning_counts ? JSON.parse(attempt.warning_counts) : {
      tabSwitches: 0,
      fullscreenExits: 0,
      voiceDetections: 0,
      networkInterruptions: 0,
      copyPasteAttempts: 0
    };

    if (eventType === 'TAB_SWITCH' || eventType === 'WINDOW_FOCUS_LOST') warningCounts.tabSwitches += 1;
    if (eventType === 'FULLSCREEN_EXIT') warningCounts.fullscreenExits += 1;
    if (eventType === 'BACKGROUND_VOICE_DETECTED') warningCounts.voiceDetections += 1;
    if (eventType === 'NETWORK_DISCONNECTED') warningCounts.networkInterruptions += 1;
    if (eventType === 'COPY_ATTEMPT' || eventType === 'PASTE_ATTEMPT') warningCounts.copyPasteAttempts += 1;

    const totalEvents = (attempt.security_events_count || 0) + 1;
    let summary = attempt.security_summary || 'Verified';
    if (totalEvents >= 2) summary = 'Needs Review';

    await run(
      `UPDATE assessment_attempts SET warning_counts = ?, security_events_count = ?, security_summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(warningCounts), totalEvents, summary, attempt.id]
    );

    // Dual Save in MongoDB
    try {
      if (getMongoStatus()) {
        await AssessmentSecurityEvent.create({
          eventId,
          attemptId: attempt.attempt_id,
          candidateId: attempt.candidate_id,
          assessmentId: attempt.assessment_id,
          eventType,
          severity,
          metadata
        });

        await AssessmentAttempt.updateOne(
          { attemptId: attempt.attempt_id },
          { 
            $set: { warningCounts, securitySummary: summary },
            $inc: { securityEventsCount: 1 }
          }
        );
      }
    } catch (mErr) {}

    return res.json({
      success: true,
      eventId,
      warningCounts,
      securitySummary: summary
    });
  } catch (err) {
    console.error('Log security event error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record proctoring security event' });
  }
});

// 4. Heartbeat & Timer Sync
router.post('/attempts/:attemptId/heartbeat', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { remainingSeconds } = req.body;

    if (typeof remainingSeconds === 'number') {
      await run(
        `UPDATE assessment_attempts SET remaining_seconds = ?, updated_at = CURRENT_TIMESTAMP WHERE attempt_id = ?`,
        [remainingSeconds, attemptId]
      );
    }

    return res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// 5. Network Interruption Recovery Log (Within 3-minute window)
router.post('/attempts/:attemptId/network-interruption', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { disconnectedAt, reconnectedAt, durationSeconds, withinRecoveryWindow } = req.body;

    const attempt = await get(`SELECT * FROM assessment_attempts WHERE attempt_id = ?`, [attemptId]);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    let netLog = attempt.network_interruption_log ? JSON.parse(attempt.network_interruption_log) : [];
    netLog.push({
      disconnectedAt,
      reconnectedAt,
      durationSeconds,
      withinRecoveryWindow: !!withinRecoveryWindow
    });

    await run(
      `UPDATE assessment_attempts SET network_interruption_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(netLog), attempt.id]
    );

    return res.json({ success: true, message: 'Network recovery log updated' });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// 6. Submit Completed Assessment
router.post('/attempts/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers = [], timeTakenSeconds } = req.body;

    const attempt = await get(`SELECT * FROM assessment_attempts WHERE attempt_id = ?`, [attemptId]);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    const asm = await get(`SELECT * FROM assessments WHERE id = ?`, [attempt.assessment_id]);
    const questions = asm?.questions_data ? JSON.parse(asm.questions_data) : [];

    // Auto-Grade
    let score = 0;
    const totalPoints = questions.length * 10;
    const gradedAnswers = answers.map((ans) => {
      const q = questions.find(item => item.id === ans.questionId);
      const isCorrect = q && q.correctOption === ans.selectedOption;
      if (isCorrect) score += (q.points || 10);
      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect: !!isCorrect,
        timeSpentSeconds: ans.timeSpentSeconds || 0
      };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const submittedAt = new Date().toISOString();

    await run(
      `UPDATE assessment_attempts SET 
        status = 'COMPLETED',
        score = ?,
        total_points = ?,
        percentage = ?,
        answers_data = ?,
        submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [score, totalPoints, percentage, JSON.stringify(gradedAnswers), attempt.id]
    );

    // Update candidate stage to 'Assessment Completed'
    await run(
      `UPDATE candidates SET current_stage = 'Assessment Completed', recruitment_status = 'Under Review' WHERE candidate_ref_id = ?`,
      [attempt.candidate_id]
    );

    await run(
      `UPDATE applications SET current_stage = 'Assessment Completed', status = 'IN_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE candidate_id = ?`,
      [attempt.candidate_id]
    );

    // Create Notification
    const notifId = `NOTIF-${Date.now()}`;
    await run(
      `INSERT INTO notifications (id, notification_id, user_id, candidate_id, title, message, type)
       VALUES (?, ?, ?, ?, 'Assessment Submitted Successfully', 'Your assessment score has been recorded and submitted for HR review.', 'ASSESSMENT_COMPLETED')`,
      [uuidv4(), notifId, attempt.user_id, attempt.candidate_id]
    );

    // Dual Save in MongoDB
    try {
      if (getMongoStatus()) {
        await AssessmentAttempt.updateOne(
          { attemptId: attempt.attempt_id },
          {
            $set: {
              status: 'COMPLETED',
              score,
              totalPoints,
              percentage,
              answers: gradedAnswers,
              submittedAt: new Date()
            }
          }
        );

        await CandidateApplication.updateOne(
          { candidateId: attempt.candidate_id },
          { 
            $set: { currentStage: 'Assessment Completed', recruitmentStatus: 'Under Review' },
            $push: { stageHistory: { stage: 'Assessment Completed', updatedBy: 'Candidate Assessment Submission', notes: `Completed with ${percentage}% score` } }
          }
        );
      }
    } catch (mErr) {}

    await logAudit({
      actorId: req.user.id,
      actorRole: 'CANDIDATE',
      actorEmail: req.user.email,
      action: 'ASSESSMENT_SUBMITTED',
      targetType: 'ASSESSMENT_ATTEMPT',
      targetId: attemptId,
      details: { score, totalPoints, percentage, candidateId: attempt.candidate_id }
    });

    return res.json({
      success: true,
      message: 'Assessment submitted successfully',
      score,
      totalPoints,
      percentage,
      status: 'COMPLETED',
      submittedAt
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit assessment' });
  }
});

// 7. Block Assessment Due to Security Violations Threshold Exceeded
router.post('/attempts/:attemptId/block', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { reason = 'Exceeded maximum permitted security violations' } = req.body;

    const attempt = await get(`SELECT * FROM assessment_attempts WHERE attempt_id = ?`, [attemptId]);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    await run(
      `UPDATE assessment_attempts SET 
        status = 'BLOCKED',
        block_reason = ?,
        security_summary = 'Blocked',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reason, attempt.id]
    );

    // Create Notification
    const notifId = `NOTIF-${Date.now()}`;
    await run(
      `INSERT INTO notifications (id, notification_id, user_id, candidate_id, title, message, type)
       VALUES (?, ?, ?, ?, 'Assessment Blocked - Review Required', 'Your assessment session was paused due to repeated security violation flags. Please contact HR support.', 'REVIEW_REQUIRED')`,
      [uuidv4(), notifId, attempt.user_id, attempt.candidate_id]
    );

    // Dual update in MongoDB
    try {
      if (getMongoStatus()) {
        await AssessmentAttempt.updateOne(
          { attemptId: attempt.attempt_id },
          { $set: { status: 'BLOCKED', blockReason: reason, securitySummary: 'Blocked' } }
        );
      }
    } catch (mErr) {}

    await logAudit({
      actorId: req.user.id,
      actorRole: 'SYSTEM',
      action: 'ASSESSMENT_BLOCKED_POLICY_EXCEEDED',
      targetType: 'ASSESSMENT_ATTEMPT',
      targetId: attemptId,
      details: { reason, candidateId: attempt.candidate_id }
    });

    return res.json({
      success: true,
      message: 'Assessment has been blocked for review',
      status: 'BLOCKED',
      reason
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to block assessment' });
  }
});

// 8. Upload Assessment Recording Chunk / Video
router.post('/attempts/:attemptId/upload-recording', (req, res) => {
  recordingUpload.single('recording')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No recording file provided' });

    const { attemptId } = req.params;
    const recordingUrl = `/uploads/recordings/${req.file.filename}`;

    try {
      await run(`UPDATE assessment_attempts SET recording_url = ? WHERE attempt_id = ?`, [recordingUrl, attemptId]);
      if (getMongoStatus()) {
        await AssessmentAttempt.updateOne({ attemptId }, { $set: { recordingUrl } });
      }
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Proctoring session recording uploaded securely',
      recordingUrl
    });
  });
});

export default router;

