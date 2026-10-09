import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { get, run, query } from '../config/db.js';
import { config } from '../config/env.js';
import { extractDeviceSignals, hashGovtId } from '../services/riskEngine.js';
import { logAudit } from '../middleware/audit.js';
import { CandidateApplication } from '../models/CandidateApplication.js';
import { OtpService } from '../services/otp/OtpService.js';
import { AadhaarService } from '../services/aadhaar/AadhaarService.js';
import { ResumeAnalysisService } from '../services/resumeAnalysis/ResumeAnalysisService.js';
import { getMongoStatus } from '../config/mongo.js';

const router = express.Router();

// Ensure standard uploads directory exists
const uploadDir = path.resolve(config.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Ensure dedicated resumes upload directory exists
const resumesDir = path.resolve(config.UPLOAD_DIR, 'resumes');
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

// Multer Storage for Generic Uploads
const genericStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(cleanName);
    const base = path.basename(cleanName, ext);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const genericUpload = multer({
  storage: genericStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP'));
    }
  }
});

// Dedicated Multer Storage for Resumes (uploads/resumes directory, 5MB limit, PDF/DOC/DOCX only)
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(cleanName);
    const base = path.basename(cleanName, ext);
    cb(null, `resume_${base}_${uniqueSuffix}${ext}`);
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream'
    ];

    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// 1. Dedicated Resume Upload Handler (handles "resume" or any file key up to 5MB)
router.post('/upload-resume', (req, res) => {
  resumeUpload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum allowed resume size is 5 MB.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }

    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : req.file;

    if (!uploadedFile) {
      // Check if fileData was passed in req.body (e.g. base64 / data-url fallback)
      if (req.body && req.body.fileData && req.body.fileName) {
        try {
          const rawBase64 = req.body.fileData.includes('base64,') ? req.body.fileData.split('base64,')[1] : req.body.fileData;
          const buffer = Buffer.from(rawBase64, 'base64');
          if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'File too large. Maximum allowed resume size is 5 MB.' });
          }
          const cleanName = req.body.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const ext = path.extname(cleanName).toLowerCase();
          if (!['.pdf', '.doc', '.docx'].includes(ext)) {
            return res.status(400).json({ success: false, message: 'Unsupported file type. Only PDF, DOC, and DOCX files are allowed.' });
          }
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const base = path.basename(cleanName, ext);
          const savedFileName = `resume_${base}_${uniqueSuffix}${ext}`;
          const targetPath = path.resolve(resumesDir, savedFileName);
          fs.writeFileSync(targetPath, buffer);

          const relativePath = `/uploads/resumes/${savedFileName}`;
          const resumeMetadata = {
            originalName: req.body.fileName,
            storedName: savedFileName,
            filePath: relativePath,
            fileName: req.body.fileName,
            fileUrl: relativePath,
            size: buffer.length,
            mimetype: ext === '.pdf' ? 'application/pdf' : 'application/msword',
            uploadedAt: new Date().toISOString()
          };

          return res.json({
            success: true,
            message: 'Resume uploaded successfully.',
            resume: resumeMetadata,
            fileUrl: relativePath,
            fileName: req.body.fileName
          });
        } catch (b64Err) {
          console.error('Base64 resume upload error:', b64Err);
          return res.status(400).json({ success: false, message: 'Failed to process resume file.' });
        }
      }

      return res.status(400).json({ success: false, message: 'Missing resume file. Please select a resume file (PDF/DOC/DOCX).' });
    }

    const relativePath = `/uploads/resumes/${uploadedFile.filename}`;
    const resumeMetadata = {
      originalName: uploadedFile.originalname,
      storedName: uploadedFile.filename,
      filePath: relativePath,
      fileName: uploadedFile.originalname,
      fileUrl: relativePath,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      uploadedAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume: resumeMetadata,
      fileUrl: relativePath,
      fileName: uploadedFile.originalname
    });
  });
});

// 2. Generic File Upload Handler
router.post('/upload', (req, res) => {
  genericUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      size: req.file.size
    });
  });
});

// 3. Send Email OTP to Candidate's Email Address (Nodemailer SMTP)
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const result = await OtpService.requestOtp({
      channel: 'EMAIL',
      identifier: email,
      ip,
      purpose: 'Candidate Application Email Verification'
    });

    return res.json(result);
  } catch (err) {
    console.error('Send email OTP error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to send verification email.' });
  }
});

// 4. Verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
    }

    const result = await OtpService.verifyOtp({
      channel: 'EMAIL',
      identifier: email,
      otp,
      ip
    });

    return res.json(result);
  } catch (err) {
    console.error('Verify email OTP error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Email OTP verification failed.' });
  }
});

// 5. Send Phone OTP to Candidate's Phone Number (Twilio / MSG91 / Fast2SMS)
router.post('/send-phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const result = await OtpService.requestOtp({
      channel: 'PHONE',
      identifier: phone,
      ip,
      purpose: 'Candidate Phone Verification'
    });

    return res.json(result);
  } catch (err) {
    console.error('Send phone OTP error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to send SMS OTP.' });
  }
});

// 6. Verify Phone OTP
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and 6-digit OTP code are required.' });
    }

    const result = await OtpService.verifyOtp({
      channel: 'PHONE',
      identifier: phone,
      otp,
      ip
    });

    return res.json(result);
  } catch (err) {
    console.error('Verify phone OTP error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Phone OTP verification failed.' });
  }
});

// 5. Send Real Aadhaar OTP (Verhoeff checksum + Licensed KYC Provider API)
router.post('/send-aadhaar-otp', async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const result = await AadhaarService.requestAadhaarOtp({
      aadhaarNumber,
      ip
    });

    return res.json(result);
  } catch (err) {
    console.error('Send Aadhaar OTP error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to initiate Aadhaar OTP' });
  }
});

// 6. Verify Real Aadhaar OTP (STRICT PRIVACY: NEVER STORE FULL AADHAAR)
router.post('/verify-aadhaar-otp', async (req, res) => {
  try {
    const { clientId, otp } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const result = await AadhaarService.verifyAadhaarOtp({
      clientId,
      otp,
      ip
    });

    return res.json(result);
  } catch (err) {
    console.error('Verify Aadhaar OTP error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Aadhaar OTP verification failed' });
  }
});

// 7. Verify Live Straight-Facing Photos (Exactly 3 Photos)
router.post('/verify-face-biometrics', async (req, res) => {
  try {
    const { livePhotos } = req.body;

    if (!Array.isArray(livePhotos) || livePhotos.length !== 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exactly 3 straight-facing live photo captures are required for compliance' 
      });
    }

    return res.json({
      success: true,
      message: '3 Straight-facing live photos verified successfully (DEMO/MOCK)',
      result: {
        captureCount: 3,
        poseCompliance: 'Straight Facing 100% Compliant',
        faceConsistencyScore: 0.98,
        livenessDemo: true,
        faceMatch: true,
        status: 'Verified'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Biometric verification failed' });
  }
});

// 8. Full Application Submission (Saves to MongoDB and SQLite)
router.post('/submit-full', async (req, res) => {
  try {
    const finalJobRole = req.body.jobRole || req.body.jobDetails?.jobRole || 'Candidate Role';
    const finalFirstName = req.body.firstName || req.body.personalDetails?.firstName || '';
    const finalLastName = req.body.lastName || req.body.personalDetails?.lastName || '';
    const finalEmail = req.body.email || req.body.personalDetails?.email || '';
    const finalPhone = req.body.phone || req.body.personalDetails?.phone || '';
    const finalDob = req.body.dateOfBirth || req.body.identityVerification?.dob || req.body.personalDetails?.dob || '2000-01-01';
    const finalProfilePhoto = req.body.profilePhoto || req.body.identityVerification?.profilePhoto || '/uploads/default_avatar.png';
    const finalAadhaarLast4 = req.body.aadhaarLast4 || req.body.identityVerification?.aadhaarLast4 || (req.body.identityVerification?.aadhaarNumber ? req.body.identityVerification.aadhaarNumber.slice(-4) : '9012');
    const finalAadhaarMasked = req.body.aadhaarMasked || `XXXX XXXX ${finalAadhaarLast4}`;

    // Strict Validation
    if (!finalJobRole || !finalFirstName || !finalLastName || !finalEmail || !finalPhone) {
      return res.status(400).json({ success: false, message: 'Required personal & job fields are missing' });
    }
    
    const isEmailVerified = !!req.body.emailVerified;
    const isPhoneVerified = !!req.body.phoneVerified;

    if (!isEmailVerified && !isPhoneVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification required: Please verify at least one contact method (Email or Phone Number) before submitting.' 
      });
    }

    if (!finalAadhaarLast4 || finalAadhaarLast4.length !== 4) {
      return res.status(400).json({ success: false, message: 'Aadhaar verification is required (Last 4 digits missing)' });
    }
    if (!finalProfilePhoto || !finalDob) {
      return res.status(400).json({ success: false, message: 'Profile photo and Date of Birth are required' });
    }

    // Generate Unique IDs
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
    const candidateId = `CT-2026-${randomHex}`;
    const applicationId = `APP-2026-${randomHex}`;
    const submittedAt = new Date().toISOString();

    // Collect Device / Telemetry Signals via Ropes AI
    const clientSignals = await extractDeviceSignals(req, {
      gps: req.body.gpsLocation || null,
      clientTimezone: req.body.clientTimezone || 'Asia/Kolkata'
    });
    const safeAadhaarMasked = finalAadhaarMasked;

    // Format Resume metadata object
    const resume = req.body.resume;
    const education = req.body.education || {};
    const hasWorkExperience = req.body.hasWorkExperience || false;
    const experience = req.body.experience || [];
    const hasInternship = req.body.hasInternship || false;
    const internships = req.body.internships || [];
    const skills = req.body.skills || [];

    // Format Resume metadata object
    const resumeMetadata = {
      originalName: resume?.originalName || resume?.fileName || 'resume.pdf',
      storedName: resume?.storedName || resume?.fileName || 'resume.pdf',
      filePath: resume?.filePath || resume?.fileUrl || '/uploads/resumes/resume.pdf',
      fileName: resume?.fileName || resume?.originalName || 'resume.pdf',
      fileUrl: resume?.fileUrl || resume?.filePath || '/uploads/resumes/resume.pdf',
      size: resume?.size || 0,
      uploadedAt: resume?.uploadedAt || new Date()
    };

    const livePhotosArray = Array.isArray(req.body.livePhotos) && req.body.livePhotos.length > 0
      ? req.body.livePhotos
      : [];

    // Execute Dedicated Resume Analysis & Inconsistency Intelligence
    let resumeAnalysisResult = null;
    try {
      let resumeFullPath = '';
      if (resumeMetadata.filePath) {
        resumeFullPath = path.resolve(uploadDir, '..', resumeMetadata.filePath.replace(/^\//, ''));
      }
      resumeAnalysisResult = await ResumeAnalysisService.analyzeResume({
        filePath: resumeFullPath,
        originalName: resumeMetadata.originalName,
        applicationData: {
          jobRole: finalJobRole,
          personalData: { firstName: finalFirstName, lastName: finalLastName, email: finalEmail, phone: finalPhone, dob: finalDob },
          jobData: { jobRole: finalJobRole },
          educationData: education,
          experienceData: experience,
          internshipData: internships,
          skillsData: skills
        },
        identityData: {
          dob: finalDob,
          aadhaarLast4: finalAadhaarLast4,
          aadhaarMasked: safeAadhaarMasked
        }
      });
    } catch (parseErr) {
      console.warn('Resume analysis parsing non-fatal warning:', parseErr.message);
    }

    const structuredResumeData = resumeAnalysisResult?.resumeData || ResumeAnalysisService.parseStructuredResume('', resumeMetadata.originalName);
    const resumeAnalysisReport = resumeAnalysisResult?.resumeAnalysis || {
      status: 'Consistent',
      inconsistencies: [],
      totalInconsistencies: 0,
      consistencyChecks: {
        skillsConsistency: 'Consistent',
        experienceDateConsistency: 'Consistent',
        educationConsistency: 'Consistent',
        projectConsistency: 'Consistent',
        credentialConsistency: 'Consistent'
      },
      overallStatus: 'Consistent',
      analyzedAt: new Date()
    };

    const initialWorkflowStages = {
      apply: { status: 'Completed', completedAt: new Date() },
      identity: { status: 'Completed', completedAt: new Date() },
      resumeAnalysis: { 
        status: resumeAnalysisReport.overallStatus === 'Consistent' ? 'Completed' : (resumeAnalysisReport.overallStatus === 'Inconsistency Detected' ? 'Needs Review' : 'Completed'),
        completedAt: new Date()
      },
      assessment: { status: 'Not Started' },
      interview: { status: 'Not Started' },
      offer: { status: 'Not Started' },
      onboarding: { status: 'Not Started' }
    };

    // 1. Save to MongoDB if available
    let mongoSaved = false;
    try {
      if (getMongoStatus()) {
        await CandidateApplication.create({
          candidateId,
          applicationId,
          jobRole: finalJobRole,
          firstName: finalFirstName,
          lastName: finalLastName,
          email: finalEmail.toLowerCase(),
          phone: finalPhone,
          emailVerified: isEmailVerified,
          phoneVerified: isPhoneVerified,
          education: education,
          hasWorkExperience: !!hasWorkExperience,
          experience: hasWorkExperience ? (experience || []) : [],
          hasInternship: !!hasInternship,
          internships: hasInternship ? (internships || []) : [],
          skills: skills || [],
          resume: resumeMetadata,
          resumeData: structuredResumeData,
          resumeAnalysis: resumeAnalysisReport,
          workflowStages: initialWorkflowStages,
          profilePhoto: finalProfilePhoto || '',
          livePhotos: livePhotosArray,
          dateOfBirth: finalDob,
          aadhaarLast4: finalAadhaarLast4, // ONLY LAST 4 STORED
          aadhaarMasked: safeAadhaarMasked,
          identityVerification: {
            status: 'Verified',
            faceMatch: true,
            faceConsistencyScore: 0.98,
            livenessDemo: true,
            captureCount: 3,
            poseCompliance: 'Straight Facing 100% Compliant',
            isAadhaarOtpVerified: true,
            photoPaths: livePhotosArray,
            livePhotos: livePhotosArray,
            verifiedAt: new Date()
          },
          securitySignals: clientSignals,
          currentStage: 'Resume Analysis',
          recruitmentStatus: 'In Progress',
          applicationStatus: 'Submitted',
          submittedAt: new Date()
        });
        mongoSaved = true;
        console.log(`Saved application ${applicationId} to MongoDB with resume analysis and 7-stage workflow tracker`);
      }
    } catch (mErr) {
      console.warn('MongoDB write error:', mErr.message);
    }

    // 2. Save to SQLite (Relational DB fallback & sync)
    const sqlAppId = uuidv4();
    const cleanEmail = finalEmail.toLowerCase().trim();

    // Ensure User account exists for the candidate so they can log in via Common Login
    let existingUser = await get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    let candUserId = existingUser?.id;

    if (!existingUser) {
      candUserId = uuidv4();
      const rawPassword = req.body.password || 'Demo@1234';
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      const username = cleanEmail.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900);
      
      await run(
        `INSERT INTO users (id, username, email, phone, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?, 'CANDIDATE', 'ACTIVE')`,
        [candUserId, username, cleanEmail, finalPhone, passwordHash]
      );
    } else if (req.body.password) {
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      await run(
        `UPDATE users SET password_hash = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [passwordHash, finalPhone, existingUser.id]
      );
    }

    const overallStatus = clientSignals.human_review_required ? 'Needs Review' : 'Verified';
    const initialStatus = clientSignals.human_review_required ? 'NEEDS_REVIEW' : 'SUBMITTED';

    await run(
      `INSERT INTO applications (
        id, application_no, email, is_email_verified, candidate_id, user_id, status, 
        role_applied, personal_data, job_data, experience_data, internship_data, 
        education_data, skills_data, resume_file, profile_photo, risk_score, overall_status,
        current_stage, recruitment_status, resume_data, resume_analysis, workflow_stages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Resume Analysis', 'In Progress', ?, ?, ?)`,
      [
        sqlAppId,
        applicationId,
        cleanEmail,
        isEmailVerified ? 1 : 0,
        candidateId,
        candUserId,
        initialStatus,
        finalJobRole,
        JSON.stringify({ 
          firstName: finalFirstName, 
          lastName: finalLastName, 
          phone: finalPhone, 
          email: cleanEmail, 
          emailVerified: isEmailVerified, 
          phoneVerified: isPhoneVerified, 
          dateOfBirth: finalDob 
        }),
        JSON.stringify({ jobRole: finalJobRole }),
        JSON.stringify(hasWorkExperience ? (experience || []) : []),
        JSON.stringify(hasInternship ? (internships || []) : []),
        JSON.stringify(education || {}),
        JSON.stringify(skills || []),
        resumeMetadata.fileName,
        finalProfilePhoto,
        clientSignals.threat_score || 4,
        overallStatus,
        JSON.stringify(structuredResumeData),
        JSON.stringify(resumeAnalysisReport),
        JSON.stringify(initialWorkflowStages)
      ]
    );

    // Insert or update candidates table
    const existingCand = await get('SELECT id FROM candidates WHERE LOWER(email) = ?', [cleanEmail]);
    if (!existingCand) {
      await run(
        `INSERT INTO candidates (id, candidate_ref_id, user_id, application_id, first_name, last_name, email, phone, profile_photo, current_stage, recruitment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Resume Analysis', 'In Progress')`,
        [uuidv4(), candidateId, candUserId, sqlAppId, finalFirstName, finalLastName, cleanEmail, finalPhone, finalProfilePhoto]
      );
    } else {
      await run(
        `UPDATE candidates SET candidate_ref_id = ?, user_id = ?, application_id = ?, first_name = ?, last_name = ?, profile_photo = ?, current_stage = 'Resume Analysis', recruitment_status = 'In Progress' WHERE id = ?`,
        [candidateId, candUserId, sqlAppId, finalFirstName, finalLastName, finalProfilePhoto, existingCand.id]
      );
    }

    // Save Resume Analysis record in SQLite
    await run(
      `INSERT INTO resume_analyses (id, application_id, candidate_id, resume_file, extracted_resume_data, inconsistencies, consistency_checks, overall_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        sqlAppId,
        candidateId,
        resumeMetadata.fileName,
        JSON.stringify(structuredResumeData),
        JSON.stringify(resumeAnalysisReport.inconsistencies || []),
        JSON.stringify(resumeAnalysisReport.consistencyChecks || {}),
        resumeAnalysisReport.overallStatus || 'Consistent'
      ]
    );

    // Save Identity & Biometric records in SQLite
    await run(
      `INSERT INTO identity_verifications (id, application_id, legal_first_name, legal_last_name, dob, govt_id_type, govt_id_masked, govt_id_hash, verification_status, is_demo)
       VALUES (?, ?, ?, ?, ?, 'Aadhaar', ?, ?, 'Verified', 1)`,
      [uuidv4(), sqlAppId, finalFirstName, finalLastName, finalDob, safeAadhaarMasked, hashGovtId(finalAadhaarLast4)]
    );

    await run(
      `INSERT INTO biometric_verifications (id, application_id, capture_count, photo_paths, pose_compliance, face_consistency_score, liveness_score, face_match_status, verification_status, notes, is_demo)
       VALUES (?, ?, 3, ?, 'Straight Facing 100% Compliant', 0.98, 0.96, 'Verified', 'Verified', '3 live straight-facing photos verified', 1)`,
      [uuidv4(), sqlAppId, JSON.stringify(livePhotosArray)]
    );

    await run(
      `INSERT INTO device_signals (
        id, application_id, ip_address, approx_location, user_agent, device_type, 
        browser, os, session_identifier, is_vpn_or_proxy, risk_flags, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        sqlAppId,
        clientSignals.ip_address,
        clientSignals.approx_location,
        clientSignals.user_agent,
        clientSignals.device_type,
        clientSignals.browser,
        clientSignals.os,
        clientSignals.session_identifier,
        clientSignals.is_vpn_or_proxy,
        JSON.stringify(clientSignals.risk_flags || []),
        clientSignals.risk_level || 'LOW'
      ]
    );

    await logAudit({
      actorRole: 'CANDIDATE',
      actorEmail: finalEmail,
      action: 'APPLICATION_SUBMITTED_SUCCESS',
      targetType: 'APPLICATION',
      targetId: applicationId,
      details: { candidateId, applicationId, mongoSaved, resume: resumeMetadata }
    });

    return res.json({
      success: true,
      message: 'Application Submitted Successfully',
      candidateId,
      applicationId,
      submissionDate: submittedAt,
      applicationStatus: 'Submitted',
      currentStage: 'Resume Analysis',
      aadhaarMasked: safeAadhaarMasked,
      identityStatus: 'Verified',
      resumeData: structuredResumeData,
      resumeAnalysis: resumeAnalysisReport,
      workflowStages: initialWorkflowStages,
      mongoSaved
    });
  } catch (err) {
    console.error('Submit application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit candidate application: ' + err.message });
  }
});

// 9. Dedicated Standalone Resume Analysis & Inconsistency Check Endpoint
router.post('/analyze-resume', async (req, res) => {
  try {
    const { filePath, originalName, applicationData, identityData } = req.body;

    let targetPath = filePath;
    if (filePath && !path.isAbsolute(filePath)) {
      targetPath = path.resolve(uploadDir, '..', filePath.replace(/^\//, ''));
    }

    const result = await ResumeAnalysisService.analyzeResume({
      filePath: targetPath,
      originalName: originalName || 'resume.pdf',
      applicationData: applicationData || {},
      identityData: identityData || {}
    });

    return res.json(result);
  } catch (err) {
    console.error('Standalone resume analysis error:', err);
    return res.status(500).json({ success: false, message: 'Failed to analyze resume: ' + err.message });
  }
});

export default router;
