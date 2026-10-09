import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { CandidateApplication } from '../models/CandidateApplication.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { Notification } from '../models/Notification.js';
import { getMongoStatus } from '../config/mongo.js';
import { ResumeAnalysisService } from '../services/resumeAnalysis/ResumeAnalysisService.js';
import { config } from '../config/env.js';

const router = express.Router();
router.use(requireAuth);

const uploadDir = path.resolve(config.UPLOAD_DIR);

// 1. Candidate Dashboard Overview & 7-Stage Workflow Tracker
router.get('/me/dashboard', async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const userId = req.user.id;

    // Fetch candidate record from SQLite
    const candidate = await get(
      `SELECT c.*, a.id AS app_db_id, a.application_no, a.status AS application_status, a.role_applied,
              a.current_stage, a.recruitment_status, a.risk_score, a.overall_status, a.created_at AS application_date,
              a.personal_data, a.job_data, a.education_data, a.skills_data, a.resume_file,
              a.resume_data, a.resume_analysis, a.workflow_stages
       FROM candidates c
       LEFT JOIN applications a ON c.application_id = a.id OR c.email = a.email
       WHERE LOWER(c.email) = ? OR c.user_id = ?
       ORDER BY a.created_at DESC LIMIT 1`,
      [userEmail, userId]
    );

    // If candidate has an active application in MongoDB
    let mongoApp = null;
    try {
      if (getMongoStatus()) {
        mongoApp = await CandidateApplication.findOne({ email: userEmail }).sort({ createdAt: -1 });
      }
    } catch (mErr) {}

    const candRefId = candidate?.candidate_ref_id || mongoApp?.candidateId || 'CT-2026-PENDING';
    const currentStage = candidate?.current_stage || mongoApp?.currentStage || 'Resume Analysis';
    const recruitmentStatus = candidate?.recruitment_status || mongoApp?.recruitmentStatus || 'In Progress';

    // Parse resume data & analysis
    let resumeData = mongoApp?.resumeData || (candidate?.resume_data ? JSON.parse(candidate.resume_data) : null);
    let resumeAnalysis = mongoApp?.resumeAnalysis || (candidate?.resume_analysis ? JSON.parse(candidate.resume_analysis) : null);

    // Fallback: If resume analysis not generated yet, auto-run on candidate's application data
    if (!resumeAnalysis && (candidate || mongoApp)) {
      const personal = candidate?.personal_data ? JSON.parse(candidate.personal_data) : (mongoApp || {});
      const appJob = candidate?.job_data ? JSON.parse(candidate.job_data) : { jobRole: mongoApp?.jobRole };
      const appEdu = candidate?.education_data ? JSON.parse(candidate.education_data) : (mongoApp?.education || {});
      const appExp = candidate?.experience_data ? JSON.parse(candidate.experience_data || '[]') : (mongoApp?.experience || []);
      const appSkills = candidate?.skills_data ? JSON.parse(candidate.skills_data || '[]') : (mongoApp?.skills || []);

      const analysisResult = await ResumeAnalysisService.analyzeResume({
        originalName: candidate?.resume_file || mongoApp?.resume?.fileName || 'resume.pdf',
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

    // Find any scheduled assessments for this candidate
    let scheduledAssessment = null;
    if (candRefId) {
      const asmRow = await get(
        `SELECT * FROM assessments WHERE (candidate_id = ? OR job_role = ?) AND status != 'CANCELLED' ORDER BY created_at DESC LIMIT 1`,
        [candRefId, candidate?.role_applied || mongoApp?.jobRole || '']
      );

      if (asmRow) {
        const attempt = await get(
          `SELECT * FROM assessment_attempts WHERE assessment_id = ? AND candidate_id = ? ORDER BY created_at DESC LIMIT 1`,
          [asmRow.id, candRefId]
        );

        scheduledAssessment = {
          id: asmRow.id,
          assessmentId: asmRow.assessment_id,
          title: asmRow.title,
          jobRole: asmRow.job_role,
          scheduledDate: asmRow.scheduled_date,
          windowStartTime: asmRow.window_start_time,
          windowEndTime: asmRow.window_end_time,
          durationMinutes: asmRow.duration_minutes,
          instructions: asmRow.instructions,
          status: asmRow.status,
          attempt: attempt ? {
            attemptId: attempt.attempt_id,
            status: attempt.status,
            score: attempt.score,
            percentage: attempt.percentage,
            submittedAt: attempt.submitted_at,
            blockReason: attempt.block_reason,
            securitySummary: attempt.security_summary
          } : null
        };
      }
    }

    // Determine 7-Stage Pipeline Statuses
    // 1. Apply
    // 2. Identity Verification
    // 3. Resume Analysis
    // 4. Assessment
    // 5. Interview
    // 6. Offer
    // 7. Onboarding

    const isApplyDone = true;
    const isIdentityDone = true;
    
    // Resume Analysis status: Completed, Needs Review, or In Progress
    let resumeStageStatus = 'Completed';
    if (resumeAnalysis?.overallStatus === 'Inconsistency Detected' || resumeAnalysis?.overallStatus === 'Needs Review') {
      resumeStageStatus = 'Needs Review';
    } else if (!resumeAnalysis) {
      resumeStageStatus = 'In Progress';
    }

    // Assessment Dependency: Assessment is unlocked ONLY after Resume Analysis is done
    const isResumeAnalysisCompleted = resumeStageStatus === 'Completed' || resumeStageStatus === 'Needs Review';
    
    let assessmentStageStatus = 'Not Started';
    if (!isResumeAnalysisCompleted) {
      assessmentStageStatus = 'Blocked';
    } else if (scheduledAssessment?.attempt?.status === 'COMPLETED') {
      assessmentStageStatus = 'Completed';
    } else if (scheduledAssessment?.attempt?.status === 'BLOCKED') {
      assessmentStageStatus = 'Needs Review';
    } else if (scheduledAssessment) {
      assessmentStageStatus = 'In Progress';
    }

    // Interview Stage Status
    let interviewStageStatus = 'Not Started';
    if (['Interview', 'Selected', 'Offer', 'Onboarding'].includes(currentStage)) {
      interviewStageStatus = (currentStage === 'Interview') ? 'In Progress' : 'Completed';
    } else if (assessmentStageStatus !== 'Completed') {
      interviewStageStatus = 'Not Started';
    }

    // Offer Stage Status
    let offerStageStatus = 'Not Started';
    if (['Offer', 'Selected', 'Onboarding'].includes(currentStage) || mongoApp?.offerDetails?.status === 'Accepted' || mongoApp?.offerDetails?.status === 'Generated') {
      offerStageStatus = (currentStage === 'Onboarding' || mongoApp?.offerDetails?.status === 'Accepted') ? 'Completed' : 'In Progress';
    }

    // Onboarding Stage Status
    let onboardingStageStatus = 'Not Started';
    if (currentStage === 'Onboarding' || mongoApp?.onboardingDetails?.status === 'In Progress') {
      onboardingStageStatus = mongoApp?.onboardingDetails?.status === 'Completed' ? 'Completed' : 'In Progress';
    }

    // 7-Stage Pipeline Stepper Object Array
    const pipelineStages = [
      {
        id: 1,
        key: 'apply',
        name: 'Apply',
        status: 'Completed', // 'Completed' | 'In Progress' | 'Needs Review' | 'Not Started' | 'Blocked'
        description: 'Application details & job requirements submitted.'
      },
      {
        id: 2,
        key: 'identity',
        name: 'Identity Verification',
        status: 'Completed',
        description: 'Aadhaar checksum & live straight webcam biometrics verified.'
      },
      {
        id: 3,
        key: 'resumeAnalysis',
        name: 'Resume Analysis',
        status: resumeStageStatus,
        description: resumeStageStatus === 'Completed' ? 'Structured extraction & consistency verification passed.' : 'Inconsistencies detected requiring HR review.'
      },
      {
        id: 4,
        key: 'assessment',
        name: 'Assessment',
        status: assessmentStageStatus,
        description: !isResumeAnalysisCompleted ? 'Complete Resume Analysis to continue.' : (scheduledAssessment ? 'Online proctored test session.' : 'Awaiting HR assessment schedule.')
      },
      {
        id: 5,
        key: 'interview',
        name: 'Interview',
        status: interviewStageStatus,
        description: 'Technical evaluation and behavioral panel interview.'
      },
      {
        id: 6,
        key: 'offer',
        name: 'Offer',
        status: offerStageStatus,
        description: 'Offer letter release, compensation, and candidate sign-off.'
      },
      {
        id: 7,
        key: 'onboarding',
        name: 'Onboarding',
        status: onboardingStageStatus,
        description: 'Document submission, identity audit, and company orientation.'
      }
    ];

    // Notifications
    const notifications = await query(
      `SELECT * FROM notifications WHERE user_id = ? OR candidate_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId, candRefId || '']
    );

    // Verification summary
    const verificationSummary = {
      identityStatus: 'Verified',
      biometricStatus: 'Verified',
      aadhaarMasked: 'XXXX XXXX ' + (mongoApp?.aadhaarLast4 || '4321'),
      emailVerified: true,
      phoneVerified: true,
      resumeAnalysisStatus: resumeStageStatus
    };

    return res.json({
      success: true,
      data: {
        candidateId: candRefId,
        applicationId: candidate?.application_no || mongoApp?.applicationId || 'APP-2026-PENDING',
        fullName: candidate ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() : (mongoApp ? `${mongoApp.firstName} ${mongoApp.lastName}` : req.user.username),
        email: userEmail,
        phone: candidate?.phone || mongoApp?.phone || '+91 98765 43210',
        jobRole: candidate?.role_applied || mongoApp?.jobRole || 'Software Engineer',
        currentStage,
        recruitmentStatus,
        verificationSummary,
        pipelineStages,
        resumeData,
        resumeAnalysis,
        isAssessmentAvailable: isResumeAnalysisCompleted,
        scheduledAssessment,
        interviewDetails: mongoApp?.interviewDetails || { status: 'Not Scheduled', mode: 'Online Video' },
        offerDetails: mongoApp?.offerDetails || { status: 'Pending' },
        onboardingDetails: mongoApp?.onboardingDetails || { status: 'Not Started', completionPercentage: 0 },
        notifications,
        applicationDate: candidate?.application_date || mongoApp?.submittedAt || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Fetch candidate dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load candidate dashboard profile: ' + err.message });
  }
});

// 2. Candidate Resume Analysis On-Demand Execution
router.post('/resume-analysis', async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const userId = req.user.id;

    const candidate = await get(
      `SELECT c.*, a.id AS app_db_id, a.personal_data, a.job_data, a.education_data, a.experience_data, a.internship_data, a.skills_data, a.resume_file
       FROM candidates c
       LEFT JOIN applications a ON c.application_id = a.id OR c.email = a.email
       WHERE LOWER(c.email) = ? OR c.user_id = ?
       ORDER BY a.created_at DESC LIMIT 1`,
      [userEmail, userId]
    );

    let mongoApp = null;
    try {
      if (getMongoStatus()) {
        mongoApp = await CandidateApplication.findOne({ email: userEmail }).sort({ createdAt: -1 });
      }
    } catch (e) {}

    const personal = candidate?.personal_data ? JSON.parse(candidate.personal_data) : (mongoApp || {});
    const appJob = candidate?.job_data ? JSON.parse(candidate.job_data) : { jobRole: mongoApp?.jobRole };
    const appEdu = candidate?.education_data ? JSON.parse(candidate.education_data) : (mongoApp?.education || {});
    const appExp = candidate?.experience_data ? JSON.parse(candidate.experience_data || '[]') : (mongoApp?.experience || []);
    const appSkills = candidate?.skills_data ? JSON.parse(candidate.skills_data || '[]') : (mongoApp?.skills || []);

    const resumeFileName = req.body.fileName || candidate?.resume_file || mongoApp?.resume?.fileName || 'resume.pdf';
    let resumeFilePath = req.body.filePath;

    if (resumeFilePath && !path.isAbsolute(resumeFilePath)) {
      resumeFilePath = path.resolve(uploadDir, '..', resumeFilePath.replace(/^\//, ''));
    }

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

    // Save update in MongoDB
    try {
      if (getMongoStatus()) {
        await CandidateApplication.updateOne(
          { email: userEmail },
          {
            $set: {
              resumeData: structuredResumeData,
              resumeAnalysis: resumeAnalysisReport,
              'workflowStages.resumeAnalysis.status': resumeAnalysisReport.overallStatus === 'Inconsistency Detected' ? 'Needs Review' : 'Completed',
              'workflowStages.resumeAnalysis.completedAt': new Date()
            }
          }
        );
      }
    } catch (e) {}

    // Save update in SQLite
    if (candidate?.app_db_id) {
      await run(
        `UPDATE applications SET resume_data = ?, resume_analysis = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(structuredResumeData), JSON.stringify(resumeAnalysisReport), candidate.app_db_id]
      );

      await run(
        `INSERT INTO resume_analyses (id, application_id, candidate_id, resume_file, extracted_resume_data, inconsistencies, consistency_checks, overall_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          candidate.app_db_id,
          candidate.candidate_ref_id,
          resumeFileName,
          JSON.stringify(structuredResumeData),
          JSON.stringify(resumeAnalysisReport.inconsistencies || []),
          JSON.stringify(resumeAnalysisReport.consistencyChecks || {}),
          resumeAnalysisReport.overallStatus || 'Consistent'
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Resume Analysis completed successfully',
      resumeData: structuredResumeData,
      resumeAnalysis: resumeAnalysisReport
    });
  } catch (err) {
    console.error('Candidate resume analysis error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process resume analysis: ' + err.message });
  }
});

// 3. Candidate Notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25`,
      [userId]
    );

    return res.json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// 4. Mark Notification as Read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await run(`UPDATE notifications SET is_read = 1 WHERE id = ? OR notification_id = ?`, [id, id]);
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

export default router;
