import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { AssessmentSecurityEvent } from '../models/AssessmentSecurityEvent.js';
import { CandidateApplication } from '../models/CandidateApplication.js';
import { Notification } from '../models/Notification.js';
import { getMongoStatus } from '../config/mongo.js';
import { ResumeAnalysisService } from '../services/resumeAnalysis/ResumeAnalysisService.js';

const router = express.Router();

// Require HR or ADMIN authentication for all routes in this router
router.use(requireAuth);
router.use(requireRole('HR', 'ADMIN'));

// Default Question Bank by Role
const defaultQuestionsByRole = {
  default: [
    {
      id: 1,
      question: 'What is the primary difference between synchronous and asynchronous execution in JavaScript?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'Synchronous code blocks further execution until complete; asynchronous allows non-blocking execution via the Event Loop',
        'Asynchronous code runs on a separate physical thread automatically in the V8 engine',
        'Synchronous code can only execute in browser environments, not in Node.js',
        'There is no difference in JavaScript engine execution'
      ],
      correctOption: 0,
      points: 10,
      explanation: 'JavaScript uses a single-threaded Event Loop where asynchronous tasks are queued and processed non-blockingly.'
    },
    {
      id: 2,
      question: 'Which of the following HTTP status codes indicates that a client must authenticate itself to get the requested response?',
      type: 'MULTIPLE_CHOICE',
      options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
      correctOption: 1,
      points: 10,
      explanation: '401 Unauthorized indicates unauthenticated request; 403 Forbidden indicates authenticated but lacking permission.'
    },
    {
      id: 3,
      question: 'In database optimization, what is the primary benefit of creating a database index on a frequently queried column?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'Faster data retrieval by allowing the engine to locate records without full table scans',
        'Decreases the disk space used by table records',
        'Eliminates the need for foreign key constraints',
        'Accelerates write (INSERT/UPDATE) operations unconditionally'
      ],
      correctOption: 0,
      points: 10,
      explanation: 'Indexes create search trees (like B-Trees) allowing logarithmic search time instead of O(N) full table scans.'
    },
    {
      id: 4,
      question: 'What is the purpose of JWT (JSON Web Tokens) signature verification in REST APIs?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'To encrypt payload data so the client cannot inspect its contents',
        'To verify that the sender is who it says it is and ensure that the message was not changed along the way',
        'To compress HTTP header payloads for mobile networks',
        'To store session states directly in database memory'
      ],
      correctOption: 1,
      points: 10,
      explanation: 'JWT signatures use cryptographic hashing (HMAC/RSA) to ensure integrity and authenticity of claims.'
    },
    {
      id: 5,
      question: 'In React, what is the primary purpose of the useMemo hook?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'To memoize expensive calculation results between component re-renders',
        'To trigger immediate asynchronous side effects after DOM mutation',
        'To establish a persistent global Redux store connection',
        'To prevent child components from ever re-rendering'
      ],
      correctOption: 0,
      points: 10,
      explanation: 'useMemo caches the result of a calculation between re-renders unless specified dependency values change.'
    },
    {
      id: 6,
      question: 'Which security vulnerability occurs when user input is directly concatenated into a database query string?',
      type: 'MULTIPLE_CHOICE',
      options: ['Cross-Site Scripting (XSS)', 'SQL Injection (SQLi)', 'Cross-Site Request Forgery (CSRF)', 'Denial of Service (DoS)'],
      correctOption: 1,
      points: 10,
      explanation: 'SQL Injection occurs when untrusted input alters the syntactic structure of an executable SQL query.'
    }
  ]
};

// 1. List Candidates for HR Review & Stage Monitoring
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await query(`
      SELECT 
        a.id AS application_id,
        a.application_no,
        a.candidate_id,
        a.email,
        a.status AS application_status,
        a.overall_status,
        a.current_stage,
        a.recruitment_status,
        a.risk_score,
        a.personal_data,
        a.job_data,
        a.experience_data,
        a.internship_data,
        a.education_data,
        a.skills_data,
        a.profile_photo,
        a.resume_file,
        a.created_at,
        c.candidate_ref_id,
        c.first_name,
        c.last_name,
        c.phone,
        iv.verification_status AS identity_status,
        iv.govt_id_type,
        iv.govt_id_masked,
        bv.verification_status AS biometric_status,
        bv.face_match_status,
        bv.liveness_score,
        ds.risk_level AS device_risk_level,
        ds.ip_address,
        ds.approx_location,
        ds.risk_flags AS device_risk_flags,
        si.composite_status AS synthetic_status,
        si.composite_score AS synthetic_score,
        si.signal_details AS synthetic_signal_details
      FROM applications a
      LEFT JOIN candidates c ON a.id = c.application_id OR a.candidate_id = c.candidate_ref_id
      LEFT JOIN identity_verifications iv ON a.id = iv.application_id
      LEFT JOIN biometric_verifications bv ON a.id = bv.application_id
      LEFT JOIN device_signals ds ON a.id = ds.application_id
      LEFT JOIN synthetic_identity_signals si ON a.id = si.application_id
      ORDER BY a.created_at DESC
    `);

    // Fetch assessment attempt summaries for all candidates
    const attempts = await query(`
      SELECT candidate_id, assessment_id, status, score, percentage, security_summary, security_events_count, warning_counts, submitted_at
      FROM assessment_attempts
      ORDER BY created_at DESC
    `);

    const attemptMap = {};
    attempts.forEach(att => {
      if (!attemptMap[att.candidate_id]) attemptMap[att.candidate_id] = att;
    });

    const formatted = candidates.map((row) => {
      const personal = row.personal_data ? JSON.parse(row.personal_data) : {};
      const job = row.job_data ? JSON.parse(row.job_data) : {};
      const experience = row.experience_data ? JSON.parse(row.experience_data) : [];
      const internship = row.internship_data ? JSON.parse(row.internship_data) : [];
      const education = row.education_data ? JSON.parse(row.education_data) : {};

      const fullName = personal.firstName 
        ? `${personal.firstName} ${personal.lastName || ''}`.trim() 
        : (row.first_name ? `${row.first_name} ${row.last_name || ''}`.trim() : row.email.split('@')[0]);

      const jobRole = job.jobRole || row.role_applied || 'Software Engineer';
      const candRef = row.candidate_ref_id || row.candidate_id || row.application_no;
      const candidateAttempt = attemptMap[candRef] || null;

      return {
        applicationId: row.application_id,
        applicationNo: row.application_no,
        candidateId: candRef,
        fullName,
        email: row.email,
        phone: row.phone || personal.phone || '+91 98765 43210',
        jobRole,
        employmentType: job.employmentType || 'Full Time',
        profilePhoto: row.profile_photo,
        resumeFile: row.resume_file,
        
        // Pipeline Stage & Status
        currentStage: row.current_stage || 'Application Submitted',
        recruitmentStatus: row.recruitment_status || 'In Progress',
        overallStatus: row.overall_status || 'Verified',
        riskScore: row.risk_score || 0,
        
        // Verification Signals
        identityStatus: row.identity_status || 'Verified',
        govtIdType: row.govt_id_type || 'Aadhaar',
        govtIdMasked: row.govt_id_masked || 'XXXX-XXXX-8921',
        biometricStatus: row.biometric_status || 'Verified',
        deviceRiskStatus: row.device_risk_level || 'LOW',
        deviceIp: row.ip_address || '127.0.0.1',
        deviceLocation: row.approx_location || 'Bengaluru, IN',
        syntheticStatus: row.synthetic_status || 'Verified',
        syntheticScore: row.synthetic_score || 96,
        
        // Assessment Summary if exists
        assessmentAttempt: candidateAttempt ? {
          status: candidateAttempt.status,
          score: candidateAttempt.score,
          percentage: candidateAttempt.percentage,
          securitySummary: candidateAttempt.security_summary,
          securityEventsCount: candidateAttempt.security_events_count,
          submittedAt: candidateAttempt.submitted_at
        } : null,

        createdAt: row.created_at
      };
    });

    return res.json({
      success: true,
      candidates: formatted
    });
  } catch (err) {
    console.error('Fetch review candidates error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve candidates list' });
  }
});

// 2. Fetch Deep Inspection Details for a Candidate
// Safe JSON parser helper
const safeJsonParse = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
};

// 2. Fetch Deep Inspection Details for a Candidate
router.get('/candidates/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    let app = await get(
      `SELECT * FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ? OR email = ?`,
      [id, id, id, id]
    );

    if (!app) {
      const candRow = await get(`SELECT * FROM candidates WHERE id = ? OR candidate_ref_id = ? OR email = ?`, [id, id, id]);
      if (candRow) {
        app = await get(`SELECT * FROM applications WHERE id = ? OR candidate_id = ? OR email = ?`, [candRow.application_id, candRow.candidate_ref_id, candRow.email]);
      }
    }

    let mongoApp = null;
    try {
      if (getMongoStatus()) {
        const orConditions = [{ candidateId: id }, { email: id }, { applicationId: id }, { applicationNo: id }];
        if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
          orConditions.push({ _id: id });
        }
        mongoApp = await CandidateApplication.findOne({ $or: orConditions });
        
        if (!app && mongoApp) {
          app = {
            id: mongoApp.applicationId || mongoApp.candidateId || mongoApp._id.toString(),
            application_no: mongoApp.applicationId || mongoApp.candidateId,
            candidate_id: mongoApp.candidateId,
            email: mongoApp.email,
            status: mongoApp.applicationStatus || 'Submitted',
            current_stage: mongoApp.currentStage || 'Resume Analysis',
            recruitment_status: mongoApp.recruitmentStatus || 'In Progress',
            overall_status: mongoApp.overallStatus || 'Verified',
            risk_score: mongoApp.riskScore || 0,
            personal_data: JSON.stringify({
              firstName: mongoApp.firstName,
              lastName: mongoApp.lastName,
              email: mongoApp.email,
              phone: mongoApp.phone,
              dateOfBirth: mongoApp.dateOfBirth
            }),
            job_data: JSON.stringify({ jobRole: mongoApp.jobRole }),
            experience_data: JSON.stringify(mongoApp.experience || []),
            internship_data: JSON.stringify(mongoApp.internships || []),
            education_data: JSON.stringify(mongoApp.education || {}),
            skills_data: JSON.stringify(mongoApp.skills || []),
            profile_photo: mongoApp.profilePhoto,
            resume_file: mongoApp.resume?.fileName || mongoApp.resume?.storedName || 'resume.pdf',
            created_at: mongoApp.createdAt || new Date().toISOString()
          };
        }
      }
    } catch (mErr) {
      console.error('Mongo lookup error in details:', mErr);
    }

    if (!app) {
      return res.status(404).json({ success: false, message: 'Candidate record not found' });
    }

    const candidate = await get('SELECT * FROM candidates WHERE application_id = ? OR candidate_ref_id = ? OR email = ?', [app.id, app.candidate_id, app.email]);
    const identity = await get('SELECT * FROM identity_verifications WHERE application_id = ?', [app.id]);
    const biometric = await get('SELECT * FROM biometric_verifications WHERE application_id = ?', [app.id]);
    const device = await get('SELECT * FROM device_signals WHERE application_id = ?', [app.id]);
    const synthetic = await get('SELECT * FROM synthetic_identity_signals WHERE application_id = ?', [app.id]);
    const auditLogs = await query('SELECT * FROM audit_logs WHERE target_id = ? OR target_id = ? ORDER BY created_at DESC LIMIT 15', [app.id, candidate?.candidate_ref_id || app.candidate_id]);
    
    // Fetch Assessment, Attempt and Security Events
    const candRef = candidate?.candidate_ref_id || app.candidate_id || app.application_no;
    const assessment = await get(
      'SELECT * FROM assessments WHERE candidate_id = ? OR candidate_id = ? OR candidate_id = ? ORDER BY created_at DESC LIMIT 1',
      [app.id, candRef, app.candidate_id]
    );
    const attempt = await get(
      'SELECT * FROM assessment_attempts WHERE candidate_id = ? OR candidate_id = ? OR candidate_id = ? ORDER BY created_at DESC LIMIT 1',
      [app.id, candRef, app.candidate_id]
    );
    const securityEvents = attempt 
      ? await query('SELECT * FROM assessment_security_events WHERE attempt_id = ? ORDER BY timestamp ASC', [attempt.id || attempt.attempt_id])
      : [];

    // Fetch Resume Analysis & Structured Data
    const resumeAnalysisRow = await get('SELECT * FROM resume_analyses WHERE application_id = ? OR candidate_id = ? ORDER BY analyzed_at DESC LIMIT 1', [app.id, app.candidate_id]);

    let resumeData = mongoApp?.resumeData || safeJsonParse(app.resume_data) || safeJsonParse(resumeAnalysisRow?.extracted_resume_data);
    let resumeAnalysis = mongoApp?.resumeAnalysis || safeJsonParse(app.resume_analysis) || (resumeAnalysisRow?.inconsistencies ? {
      overallStatus: resumeAnalysisRow.overall_status,
      inconsistencies: safeJsonParse(resumeAnalysisRow.inconsistencies, []),
      consistencyChecks: safeJsonParse(resumeAnalysisRow.consistency_checks, {}),
      totalInconsistencies: (safeJsonParse(resumeAnalysisRow.inconsistencies, [])).length,
      analyzedAt: resumeAnalysisRow.analyzed_at
    } : null);

    // Fallback: If resume analysis not yet computed, compute on the fly
    if (!resumeAnalysis) {
      const personal = safeJsonParse(app.personal_data, mongoApp?.personalData || {});
      const appJob = safeJsonParse(app.job_data, mongoApp?.jobData || { jobRole: mongoApp?.jobRole });
      const appEdu = safeJsonParse(app.education_data, mongoApp?.education || {});
      const appExp = safeJsonParse(app.experience_data, mongoApp?.experience || []);
      const appSkills = safeJsonParse(app.skills_data, mongoApp?.skills || []);

      const analysisResult = await ResumeAnalysisService.analyzeResume({
        originalName: app.resume_file || mongoApp?.resume?.fileName || 'resume.pdf',
        applicationData: {
          jobRole: appJob.jobRole || mongoApp?.jobRole || 'Software Engineer',
          personalData: personal,
          jobData: appJob,
          educationData: appEdu,
          experienceData: appExp,
          skillsData: appSkills
        },
        identityData: {
          dob: personal.dateOfBirth || mongoApp?.dateOfBirth || '2001-01-01',
          aadhaarLast4: mongoApp?.aadhaarLast4 || '4321',
          aadhaarMasked: mongoApp?.aadhaarMasked || 'XXXX-XXXX-4321'
        }
      });

      resumeData = analysisResult.resumeData;
      resumeAnalysis = analysisResult.resumeAnalysis;
    }

    const parsedLivePhotos = safeJsonParse(biometric?.photo_paths, mongoApp?.livePhotos || []);

    return res.json({
      success: true,
      data: {
        application: {
          id: app.id,
          applicationNo: app.application_no,
          candidateRefId: candidate?.candidate_ref_id || app.candidate_id,
          email: app.email,
          phone: app.phone || candidate?.phone || (safeJsonParse(app.personal_data, {})).phone,
          status: app.status,
          currentStage: app.current_stage || candidate?.current_stage || 'Resume Analysis',
          recruitmentStatus: app.recruitment_status || candidate?.recruitment_status || 'In Progress',
          overallStatus: app.overall_status,
          riskScore: app.risk_score,
          personalData: safeJsonParse(app.personal_data, {}),
          jobData: safeJsonParse(app.job_data, {}),
          experienceData: safeJsonParse(app.experience_data, []),
          internshipData: safeJsonParse(app.internship_data, []),
          educationData: safeJsonParse(app.education_data, {}),
          skillsData: safeJsonParse(app.skills_data, []),
          resumeFile: app.resume_file || mongoApp?.resume?.fileName || 'resume.pdf',
          profilePhoto: app.profile_photo || mongoApp?.profilePhoto,
          livePhotos: parsedLivePhotos,
          liveWebcamPhotos: parsedLivePhotos,
          resumeData,
          resumeAnalysis,
          createdAt: app.created_at
        },
        livePhotos: parsedLivePhotos,
        liveWebcamPhotos: parsedLivePhotos,
        resumeData,
        resumeAnalysis,
        workflowStages: mongoApp?.workflowStages || {
          apply: { status: 'Completed' },
          identity: { status: 'Completed' },
          resumeAnalysis: { status: resumeAnalysis?.overallStatus === 'Consistent' ? 'Completed' : 'Needs Review' },
          assessment: { status: attempt ? 'Completed' : (assessment ? 'In Progress' : 'Not Started') },
          interview: { status: app.current_stage === 'Interview' ? 'In Progress' : (app.current_stage === 'Selected' ? 'Completed' : 'Not Started') },
          offer: { status: mongoApp?.offerDetails?.status === 'Accepted' ? 'Completed' : (mongoApp?.offerDetails?.status === 'Generated' ? 'In Progress' : 'Not Started') },
          onboarding: { status: mongoApp?.onboardingDetails?.status === 'Completed' ? 'Completed' : 'Not Started' }
        },
        interviewDetails: mongoApp?.interviewDetails || { status: app.current_stage === 'Interview' ? 'Scheduled' : 'Not Scheduled', mode: 'Online Video' },
        offerDetails: mongoApp?.offerDetails || { status: app.current_stage === 'Offer' ? 'Generated' : 'Pending' },
        onboardingDetails: mongoApp?.onboardingDetails || { status: app.current_stage === 'Onboarding' ? 'In Progress' : 'Not Started', completionPercentage: 0 },
        identity: identity ? {
          legalFirstName: identity.legal_first_name,
          legalLastName: identity.legal_last_name,
          dob: identity.dob,
          govtIdType: identity.govt_id_type,
          govtIdMasked: identity.govt_id_masked,
          verificationStatus: identity.verification_status,
          confidenceScore: identity.confidence_score,
          isDemo: identity.is_demo === 1
        } : (mongoApp?.identityVerification ? {
          legalFirstName: mongoApp.firstName,
          legalLastName: mongoApp.lastName,
          dob: mongoApp.dateOfBirth,
          govtIdType: mongoApp.identityVerification.govtIdType || 'Aadhaar',
          govtIdMasked: mongoApp.aadhaarMasked || 'XXXX XXXX 4321',
          verificationStatus: mongoApp.identityVerification.status || 'Verified',
          confidenceScore: mongoApp.identityVerification.confidenceScore || 0.98,
          isDemo: false
        } : null),
        biometric: biometric ? {
          captureCount: biometric.capture_count,
          poseCompliance: biometric.pose_compliance,
          faceConsistencyScore: biometric.face_consistency_score,
          livenessScore: biometric.liveness_score,
          faceMatchStatus: biometric.face_match_status,
          verificationStatus: biometric.verification_status,
          notes: biometric.notes,
          photoPaths: parsedLivePhotos,
          livePhotos: parsedLivePhotos,
          liveWebcamPhotos: parsedLivePhotos
        } : (mongoApp?.biometricVerification ? {
          captureCount: mongoApp.biometricVerification.captureCount || 3,
          poseCompliance: '100% Compliant',
          faceConsistencyScore: mongoApp.biometricVerification.livenessScore || 0.98,
          livenessScore: mongoApp.biometricVerification.livenessScore || 0.98,
          faceMatchStatus: mongoApp.biometricVerification.status || 'Verified',
          verificationStatus: mongoApp.biometricVerification.status || 'Verified',
          notes: '3 live photos captured',
          photoPaths: parsedLivePhotos,
          livePhotos: parsedLivePhotos,
          liveWebcamPhotos: parsedLivePhotos
        } : null),
        deviceSignals: device ? {
          ipAddress: device.ip_address,
          approxLocation: device.approx_location,
          browser: device.browser,
          os: device.os,
          deviceType: device.device_type,
          riskLevel: device.risk_level,
          riskFlags: safeJsonParse(device.risk_flags, [])
        } : (mongoApp?.deviceSignals ? {
          ipAddress: mongoApp.deviceSignals.ipAddress || '127.0.0.1',
          approxLocation: mongoApp.deviceSignals.approxLocation || 'Local Host',
          browser: mongoApp.deviceSignals.browser || 'Chrome',
          os: mongoApp.deviceSignals.os || 'Windows',
          deviceType: mongoApp.deviceSignals.deviceType || 'Desktop',
          riskLevel: mongoApp.deviceSignals.riskLevel || 'LOW',
          riskFlags: mongoApp.deviceSignals.riskFlags || []
        } : null),
        syntheticSignals: synthetic ? {
          compositeStatus: synthetic.composite_status,
          compositeScore: synthetic.composite_score,
          nameDobConsistency: synthetic.name_dob_consistency,
          govtIdConsistency: synthetic.govt_id_consistency,
          phoneReputation: synthetic.phone_reputation,
          emailReputation: synthetic.email_reputation,
          accountAgeSignal: synthetic.account_age_signal,
          signalDetails: safeJsonParse(synthetic.signal_details, [])
        } : null,
        assessment: assessment ? {
          id: assessment.id,
          assessmentId: assessment.assessment_id,
          title: assessment.title,
          scheduledDate: assessment.scheduled_date,
          windowStartTime: assessment.window_start_time,
          windowEndTime: assessment.window_end_time,
          durationMinutes: assessment.duration_minutes,
          status: assessment.status
        } : null,
        attempt: attempt ? {
          attemptId: attempt.attempt_id,
          status: attempt.status,
          score: attempt.score,
          totalPoints: attempt.total_points,
          percentage: attempt.percentage,
          securitySummary: attempt.security_summary,
          warningCounts: safeJsonParse(attempt.warning_counts, {}),
          securityEventsCount: attempt.security_events_count,
          recordingUrl: attempt.recording_url,
          networkInterruptionLog: safeJsonParse(attempt.network_interruption_log, []),
          answers: safeJsonParse(attempt.answers_data, []),
          securityEvents: (securityEvents || []).map(e => ({
            eventId: e.event_id,
            eventType: e.event_type,
            severity: e.severity,
            timestamp: e.timestamp,
            metadata: safeJsonParse(e.metadata, {})
          }))
        } : null,
        auditLogs: auditLogs || []
      }
    });
  } catch (err) {
    console.error('Fetch deep details error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve candidate details: ' + err.message });
  }
});

// 3. Update Candidate Stage (Shortlist, Reject, Advance to Interview, Select)
router.post('/candidates/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body; // e.g. 'Shortlisted', 'HR Review', 'Interview', 'Selected', 'Rejected'

    const validStages = [
      'Apply',
      'Identity Verification',
      'Resume Analysis',
      'Assessment',
      'Interview',
      'Offer',
      'Onboarding',
      'Application Submitted',
      'Verification',
      'HR Review',
      'Shortlisted',
      'Assessment Scheduled',
      'Assessment Completed',
      'Selected',
      'Rejected'
    ];

    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage value: ' + stage });
    }

    const app = await get('SELECT id, email, application_no, candidate_id FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ?', [id, id, id]);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    const recruitmentStatus = (stage === 'Selected' || stage === 'Offer' || stage === 'Onboarding') 
      ? 'In Progress' 
      : (stage === 'Rejected' ? 'Rejected' : 'In Progress');

    await run(
      `UPDATE applications SET current_stage = ?, recruitment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [stage, recruitmentStatus, app.id]
    );

    await run(
      `UPDATE candidates SET current_stage = ?, recruitment_status = ? WHERE application_id = ? OR candidate_ref_id = ?`,
      [stage, recruitmentStatus, app.id, app.candidate_id]
    );

    // Create Candidate Notification
    const notifId = `NOTIF-${Date.now()}`;
    let notifTitle = `Application Stage Updated: ${stage}`;
    let notifMessage = `Your application has progressed to stage: ${stage}. ${notes || ''}`;
    if (stage === 'Shortlisted') notifMessage = 'Congratulations! You have been shortlisted by HR for the next assessment round.';
    if (stage === 'Assessment') notifMessage = 'You have progressed to the Assessment stage. Complete your technical proctored assessment.';
    if (stage === 'Interview') notifMessage = 'Congratulations! You have advanced to the Interview round.';
    if (stage === 'Offer') notifMessage = 'Congratulations! Your formal job offer is being prepared.';
    if (stage === 'Onboarding') notifMessage = 'Welcome aboard! Please complete your onboarding checklist and verification.';
    if (stage === 'Selected') notifMessage = 'Congratulations! You have been selected for the position.';
    if (stage === 'Rejected') notifMessage = 'Thank you for your interest. Your application has not been progressed at this time.';

    await run(
      `INSERT INTO notifications (id, notification_id, user_id, candidate_id, title, message, type)
       VALUES (?, ?, ?, ?, ?, ?, 'STAGE_UPDATE')`,
      [uuidv4(), notifId, app.user_id, app.candidate_id, notifTitle, notifMessage]
    );

    // Dual Update in MongoDB
    try {
      if (getMongoStatus()) {
        const updateObj = {
          currentStage: stage,
          recruitmentStatus
        };

        if (stage === 'Resume Analysis') updateObj['workflowStages.resumeAnalysis.status'] = 'Completed';
        if (stage === 'Assessment') updateObj['workflowStages.assessment.status'] = 'In Progress';
        if (stage === 'Interview') updateObj['workflowStages.interview.status'] = 'In Progress';
        if (stage === 'Offer') updateObj['workflowStages.offer.status'] = 'In Progress';
        if (stage === 'Onboarding') updateObj['workflowStages.onboarding.status'] = 'In Progress';

        await CandidateApplication.updateOne(
          { candidateId: app.candidate_id },
          {
            $set: updateObj,
            $push: { stageHistory: { stage, updatedBy: `HR Reviewer (${req.user.email})`, notes: notes || '' } }
          }
        );
      }
    } catch (mErr) {}

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action: `CANDIDATE_STAGE_ADVANCED_TO_${stage.toUpperCase().replace(/\s+/g, '_')}`,
      targetType: 'APPLICATION',
      targetId: app.id,
      details: { stage, recruitmentStatus, notes: notes || '' }
    });

    return res.json({
      success: true,
      message: `Candidate stage updated to ${stage}`,
      currentStage: stage,
      recruitmentStatus
    });
  } catch (err) {
    console.error('Update stage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update candidate stage' });
  }
});

// 3B. HR Trigger / Re-run Resume Inconsistency Analysis
router.post('/candidates/:id/analyze-resume', async (req, res) => {
  try {
    const { id } = req.params;
    const app = await get('SELECT * FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ?', [id, id, id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    let mongoApp = null;
    try {
      if (getMongoStatus()) {
        mongoApp = await CandidateApplication.findOne({ $or: [{ candidateId: app.candidate_id }, { email: app.email }] });
      }
    } catch (e) {}

    const personal = app.personal_data ? JSON.parse(app.personal_data) : (mongoApp || {});
    const appJob = app.job_data ? JSON.parse(app.job_data) : { jobRole: mongoApp?.jobRole };
    const appEdu = app.education_data ? JSON.parse(app.education_data) : (mongoApp?.education || {});
    const appExp = app.experience_data ? JSON.parse(app.experience_data || '[]') : (mongoApp?.experience || []);
    const appSkills = app.skills_data ? JSON.parse(app.skills_data || '[]') : (mongoApp?.skills || []);

    const resumeFileName = app.resume_file || mongoApp?.resume?.fileName || 'resume.pdf';
    let resumeFilePath = req.body.filePath;

    const analysisResult = await ResumeAnalysisService.analyzeResume({
      filePath: resumeFilePath,
      originalName: resumeFileName,
      applicationData: {
        jobRole: appJob.jobRole || mongoApp?.jobRole || 'Software Engineer',
        personalData: personal,
        jobData: appJob,
        educationData: appEdu,
        experienceData: appExp,
        skillsData: appSkills
      },
      identityData: {
        dob: personal.dateOfBirth || mongoApp?.dateOfBirth || '2001-01-01',
        aadhaarLast4: mongoApp?.aadhaarLast4 || '4321',
        aadhaarMasked: mongoApp?.aadhaarMasked || 'XXXX-XXXX-4321'
      }
    });

    const structuredResumeData = analysisResult.resumeData;
    const resumeAnalysisReport = analysisResult.resumeAnalysis;

    // Dual Save
    try {
      if (getMongoStatus()) {
        await CandidateApplication.updateOne(
          { candidateId: app.candidate_id },
          {
            $set: {
              resumeData: structuredResumeData,
              resumeAnalysis: resumeAnalysisReport,
              'workflowStages.resumeAnalysis.status': resumeAnalysisReport.overallStatus === 'Inconsistency Detected' ? 'Needs Review' : 'Completed'
            }
          }
        );
      }
    } catch (e) {}

    await run(
      `UPDATE applications SET resume_data = ?, resume_analysis = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(structuredResumeData), JSON.stringify(resumeAnalysisReport), app.id]
    );

    await run(
      `INSERT INTO resume_analyses (id, application_id, candidate_id, resume_file, extracted_resume_data, inconsistencies, consistency_checks, overall_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        app.id,
        app.candidate_id,
        resumeFileName,
        JSON.stringify(structuredResumeData),
        JSON.stringify(resumeAnalysisReport.inconsistencies || []),
        JSON.stringify(resumeAnalysisReport.consistencyChecks || {}),
        resumeAnalysisReport.overallStatus || 'Consistent'
      ]
    );

    return res.json({
      success: true,
      message: 'Resume Analysis executed successfully',
      resumeData: structuredResumeData,
      resumeAnalysis: resumeAnalysisReport
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to analyze resume: ' + err.message });
  }
});

// 3B2. HR Interview Scheduling & Details Update
router.post('/candidates/:id/interview', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, mode, meetingLink, interviewer, notes, status = 'Scheduled' } = req.body;

    const app = await get('SELECT * FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ?', [id, id, id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const interviewDetails = {
      status,
      scheduledDate: scheduledDate || '2026-10-25',
      scheduledTime: scheduledTime || '11:00 AM',
      mode: mode || 'Online Video (Google Meet / Zoom)',
      meetingLink: meetingLink || 'https://meet.google.com/xyz-abcd-rst',
      interviewer: interviewer || req.user.email || 'Technical Hiring Lead',
      notes: notes || 'Interview scheduled for system design and architecture assessment.'
    };

    try {
      if (getMongoStatus()) {
        await CandidateApplication.updateOne(
          { candidateId: app.candidate_id },
          {
            $set: {
              interviewDetails,
              currentStage: 'Interview',
              'workflowStages.interview.status': status === 'Completed' || status === 'Passed' ? 'Completed' : 'In Progress'
            }
          }
        );
      }
    } catch (e) {}

    await run(`UPDATE applications SET current_stage = 'Interview', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [app.id]);
    await run(`UPDATE candidates SET current_stage = 'Interview' WHERE candidate_ref_id = ?`, [app.candidate_id]);

    return res.json({ success: true, message: 'Interview details updated successfully', interviewDetails });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update interview: ' + err.message });
  }
});

// 3C. HR Job Offer Release & Compensation Details
router.post('/candidates/:id/offer', async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, designation, joiningDate, notes, status = 'Generated' } = req.body;

    const app = await get('SELECT * FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ?', [id, id, id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const offerDetails = {
      status,
      salary: salary || '₹18,00,000 / annum',
      designation: designation || app.role_applied || 'Senior Software Engineer',
      joiningDate: joiningDate || '2026-11-01',
      notes: notes || 'Offer extended post successful technical and behavioral evaluation.'
    };

    try {
      if (getMongoStatus()) {
        await CandidateApplication.updateOne(
          { candidateId: app.candidate_id },
          {
            $set: {
              offerDetails,
              currentStage: 'Offer',
              'workflowStages.offer.status': 'In Progress'
            }
          }
        );
      }
    } catch (e) {}

    await run(`UPDATE applications SET current_stage = 'Offer', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [app.id]);
    await run(`UPDATE candidates SET current_stage = 'Offer' WHERE candidate_ref_id = ?`, [app.candidate_id]);

    return res.json({ success: true, message: 'Offer details updated successfully', offerDetails });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update offer' });
  }
});

// 3D. HR Onboarding Checklist & Status Update
router.post('/candidates/:id/onboarding', async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist, completionPercentage, status = 'In Progress' } = req.body;

    const app = await get('SELECT * FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ?', [id, id, id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const onboardingDetails = {
      status,
      checklist: checklist || [
        { item: 'Identity Verification & Biometric Match', completed: true },
        { item: 'Degree Certificate & Transcript Submission', completed: true },
        { item: 'Previous Employment Relieving Letters', completed: false },
        { item: 'Company Policy & Security Compliance Sign-off', completed: true },
        { item: 'IT Hardware & Workstation Setup', completed: false }
      ],
      completionPercentage: completionPercentage !== undefined ? completionPercentage : 60
    };

    try {
      if (getMongoStatus()) {
        await CandidateApplication.updateOne(
          { candidateId: app.candidate_id },
          {
            $set: {
              onboardingDetails,
              currentStage: 'Onboarding',
              'workflowStages.onboarding.status': status
            }
          }
        );
      }
    } catch (e) {}

    await run(`UPDATE applications SET current_stage = 'Onboarding', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [app.id]);
    await run(`UPDATE candidates SET current_stage = 'Onboarding' WHERE candidate_ref_id = ?`, [app.candidate_id]);

    return res.json({ success: true, message: 'Onboarding details updated successfully', onboardingDetails });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update onboarding' });
  }
});

// 4. HR Assessment Scheduling (Flexible Start Window, Date, Duration, Questions)
router.post('/candidates/:id/schedule-assessment', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title = 'Technical Competency & Reasoning Assessment',
      scheduledDate, // YYYY-MM-DD
      windowStartTime, // e.g. "10:00 AM" or "10:00"
      windowEndTime, // e.g. "12:00 PM" or "12:00"
      durationMinutes = 60,
      instructions,
      questions
    } = req.body;

    if (!scheduledDate || !windowStartTime || !windowEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled Date, Window Start Time, and Window End Time are required.'
      });
    }

    const app = await get('SELECT id, email, application_no, candidate_id, role_applied FROM applications WHERE id = ? OR application_no = ? OR candidate_id = ?', [id, id, id]);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Candidate application not found' });
    }

    const candidateId = app.candidate_id || app.application_no;
    const assessmentId = `ASM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const sqlAsmId = uuidv4();
    const finalQuestions = (Array.isArray(questions) && questions.length > 0) ? questions : defaultQuestionsByRole.default;
    
    const policy = {
      maxTabSwitches: 3,
      maxVoiceWarnings: 3,
      maxNetworkInterruptions: 3,
      maxFullscreenExits: 3,
      maxCopyPasteAttempts: 3,
      recoveryWindowMinutes: 3,
      recordSession: true
    };

    // Insert into SQLite assessments
    await run(
      `INSERT INTO assessments (
        id, assessment_id, title, job_role, candidate_id, application_id, scheduled_date,
        window_start_time, window_end_time, duration_minutes, instructions, questions_data,
        policy_data, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')`,
      [
        sqlAsmId,
        assessmentId,
        title,
        app.role_applied || 'Software Engineer',
        candidateId,
        app.id,
        scheduledDate,
        windowStartTime,
        windowEndTime,
        durationMinutes,
        instructions || 'Ensure camera & microphone are active. You can start anytime within your scheduled window.',
        JSON.stringify(finalQuestions),
        JSON.stringify(policy),
        req.user.email
      ]
    );

    // Update candidate stage to 'Assessment Scheduled'
    await run(
      `UPDATE applications SET current_stage = 'Assessment Scheduled', recruitment_status = 'Assessment Scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [app.id]
    );

    await run(
      `UPDATE candidates SET current_stage = 'Assessment Scheduled', recruitment_status = 'Assessment Scheduled' WHERE application_id = ? OR candidate_ref_id = ?`,
      [app.id, candidateId]
    );

    // Create Candidate Notification
    const notifId = `NOTIF-${Date.now()}`;
    await run(
      `INSERT INTO notifications (id, notification_id, user_id, candidate_id, title, message, type)
       VALUES (?, ?, ?, ?, 'Assessment Scheduled', ?, 'ASSESSMENT_SCHEDULED')`,
      [
        uuidv4(),
        notifId,
        app.user_id,
        candidateId,
        `Your assessment "${title}" is scheduled for ${scheduledDate}. Available window: ${windowStartTime} – ${windowEndTime} (${durationMinutes} mins duration). You can start at any time within this window.`
      ]
    );

    // Dual Save in MongoDB
    try {
      if (getMongoStatus()) {
        await Assessment.create({
          assessmentId,
          title,
          jobRole: app.role_applied || 'Software Engineer',
          candidateId,
          applicationId: app.id,
          scheduledDate,
          windowStartTime,
          windowEndTime,
          durationMinutes,
          instructions: instructions || 'Ensure camera & microphone are active. Start anytime within the window.',
          questions: finalQuestions,
          policy,
          createdBy: req.user.email,
          status: 'SCHEDULED'
        });

        await CandidateApplication.updateOne(
          { candidateId },
          {
            $set: {
              currentStage: 'Assessment Scheduled',
              recruitmentStatus: 'Assessment Scheduled',
              assessmentDetails: {
                assessmentId,
                title,
                scheduledDate,
                windowStartTime,
                windowEndTime,
                durationMinutes,
                instructions: instructions || '',
                status: 'SCHEDULED'
              }
            },
            $push: { stageHistory: { stage: 'Assessment Scheduled', updatedBy: req.user.email, notes: `Window: ${windowStartTime} - ${windowEndTime} on ${scheduledDate}` } }
          }
        );
      }
    } catch (mErr) {
      console.warn('MongoDB assessment sync error:', mErr.message);
    }

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action: 'ASSESSMENT_SCHEDULED',
      targetType: 'ASSESSMENT',
      targetId: assessmentId,
      details: { candidateId, scheduledDate, windowStartTime, windowEndTime, durationMinutes }
    });

    return res.json({
      success: true,
      message: 'Assessment scheduled successfully with flexible start window',
      assessment: {
        assessmentId,
        title,
        scheduledDate,
        windowStartTime,
        windowEndTime,
        durationMinutes,
        candidateId
      }
    });
  } catch (err) {
    console.error('Schedule assessment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to schedule assessment' });
  }
});

// 5. List All Assessments
router.get('/assessments', async (req, res) => {
  try {
    const list = await query(`
      SELECT a.*, c.first_name, c.last_name, c.email AS candidate_email
      FROM assessments a
      LEFT JOIN candidates c ON a.candidate_id = c.candidate_ref_id
      ORDER BY a.created_at DESC
    `);

    const formatted = list.map(item => ({
      id: item.id,
      assessmentId: item.assessment_id,
      title: item.title,
      jobRole: item.job_role,
      candidateId: item.candidate_id,
      candidateName: item.first_name ? `${item.first_name} ${item.last_name || ''}`.trim() : item.candidate_id,
      scheduledDate: item.scheduled_date,
      windowStartTime: item.window_start_time,
      windowEndTime: item.window_end_time,
      durationMinutes: item.duration_minutes,
      status: item.status,
      createdAt: item.created_at
    }));

    return res.json({ success: true, assessments: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assessments' });
  }
});

// 6. Review Blocked / Flagged Assessment Attempt Decision
router.post('/attempts/:attemptId/decision', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { decision, notes } = req.body; // 'APPROVED' | 'RETEST_ALLOWED' | 'REJECTED'

    const attempt = await get('SELECT * FROM assessment_attempts WHERE attempt_id = ? OR id = ?', [attemptId, attemptId]);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    let newStatus = attempt.status;
    let newStage = 'Assessment Completed';
    if (decision === 'RETEST_ALLOWED') {
      newStatus = 'INTERRUPTED';
      newStage = 'Assessment Scheduled';
    } else if (decision === 'APPROVED') {
      newStatus = 'COMPLETED';
      newStage = 'Interview';
    } else if (decision === 'REJECTED') {
      newStage = 'Rejected';
    }

    await run(
      `UPDATE assessment_attempts SET hr_review = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify({ reviewedBy: req.user.email, reviewedAt: new Date().toISOString(), decision, notes }), newStatus, attempt.id]
    );

    await run(
      `UPDATE candidates SET current_stage = ?, recruitment_status = ? WHERE candidate_ref_id = ?`,
      [newStage, decision === 'REJECTED' ? 'Rejected' : 'In Progress', attempt.candidate_id]
    );

    // Dual Update in MongoDB
    try {
      if (getMongoStatus()) {
        await AssessmentAttempt.updateOne(
          { attemptId: attempt.attempt_id },
          { $set: { 'hrReview.decision': decision, 'hrReview.reviewedBy': req.user.email, 'hrReview.reviewedAt': new Date(), 'hrReview.notes': notes || '' } }
        );
      }
    } catch (mErr) {}

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action: `HR_ATTEMPT_DECISION_${decision}`,
      targetType: 'ASSESSMENT_ATTEMPT',
      targetId: attempt.attempt_id,
      details: { decision, notes: notes || '', candidateId: attempt.candidate_id }
    });

    return res.json({
      success: true,
      message: `Attempt review decision recorded: ${decision}`,
      decision,
      newStage
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to record decision' });
  }
});

// 7. ADMIN: Platform-Wide Overview & Stats
router.get('/admin/overview', requireRole('ADMIN'), async (req, res) => {
  try {
    const totalCandidates = await get('SELECT COUNT(*) as count FROM candidates');
    const totalApplications = await get('SELECT COUNT(*) as count FROM applications');
    const totalHRUsers = await get(`SELECT COUNT(*) as count FROM users WHERE role = 'HR'`);
    const totalAssessments = await get('SELECT COUNT(*) as count FROM assessments');
    const totalAttempts = await get('SELECT COUNT(*) as count FROM assessment_attempts');
    const blockedAttempts = await get(`SELECT COUNT(*) as count FROM assessment_attempts WHERE status = 'BLOCKED' OR security_summary = 'Blocked'`);
    const flaggedCandidates = await get(`SELECT COUNT(*) as count FROM applications WHERE overall_status = 'Needs Review' OR risk_score > 20`);
    const totalSecurityEvents = await get('SELECT COUNT(*) as count FROM assessment_security_events');

    // Stage distribution
    const stages = await query(`
      SELECT current_stage, COUNT(*) as count 
      FROM applications 
      GROUP BY current_stage
    `);

    // Recent Security Events
    const recentEvents = await query(`
      SELECT se.*, att.candidate_name, att.candidate_email
      FROM assessment_security_events se
      LEFT JOIN assessment_attempts att ON se.attempt_id = att.id OR se.attempt_id = att.attempt_id
      ORDER BY se.timestamp DESC LIMIT 10
    `);

    return res.json({
      success: true,
      stats: {
        totalCandidates: totalCandidates?.count || 0,
        totalApplications: totalApplications?.count || 0,
        totalHRUsers: totalHRUsers?.count || 0,
        totalAssessments: totalAssessments?.count || 0,
        totalAttempts: totalAttempts?.count || 0,
        blockedAttempts: blockedAttempts?.count || 0,
        flaggedCandidates: flaggedCandidates?.count || 0,
        totalSecurityEvents: totalSecurityEvents?.count || 0
      },
      stages,
      recentEvents: recentEvents.map(e => ({
        eventId: e.event_id,
        attemptId: e.attempt_id,
        candidateName: e.candidate_name || e.candidate_id,
        candidateEmail: e.candidate_email,
        eventType: e.event_type,
        severity: e.severity,
        timestamp: e.timestamp,
        metadata: e.metadata ? JSON.parse(e.metadata) : {}
      }))
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin overview' });
  }
});

// 8. ADMIN: Live Proctoring Security Events Feed
router.get('/admin/security-events', requireRole('ADMIN'), async (req, res) => {
  try {
    const events = await query(`
      SELECT se.*, att.candidate_name, att.candidate_email, att.attempt_id as attempt_ref
      FROM assessment_security_events se
      LEFT JOIN assessment_attempts att ON se.attempt_id = att.id OR se.attempt_id = att.attempt_id
      ORDER BY se.timestamp DESC LIMIT 100
    `);

    return res.json({
      success: true,
      events: events.map(e => ({
        eventId: e.event_id,
        attemptId: e.attempt_ref || e.attempt_id,
        candidateName: e.candidate_name || e.candidate_id,
        candidateEmail: e.candidate_email,
        eventType: e.event_type,
        severity: e.severity,
        timestamp: e.timestamp,
        metadata: e.metadata ? JSON.parse(e.metadata) : {}
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch security events' });
  }
});

// 9. ADMIN: System Audit Logs
router.get('/admin/audit-logs', requireRole('ADMIN'), async (req, res) => {
  try {
    const logs = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
    return res.json({
      success: true,
      logs: logs.map(l => ({
        id: l.id,
        actorId: l.actor_id,
        actorRole: l.actor_role,
        actorEmail: l.actor_email,
        action: l.action,
        targetType: l.target_type,
        targetId: l.target_id,
        ipAddress: l.ip_address,
        details: l.details ? JSON.parse(l.details) : {},
        createdAt: l.created_at
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// 10. ADMIN: HR Users List & Activity Summary
router.get('/admin/hr-users', requireRole('ADMIN'), async (req, res) => {
  try {
    const hrUsers = await query(`SELECT id, username, email, phone, role, status, created_at FROM users WHERE role = 'HR'`);
    return res.json({ success: true, hrUsers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch HR users' });
  }
});

export default router;
