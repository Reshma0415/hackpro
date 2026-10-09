import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './env.js';

const uploadDir = path.resolve(config.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new sqlite3.Database(config.DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${config.DB_PATH}`);
  }
});

// Promisified query helpers
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDb = async () => {
  // Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('CANDIDATE', 'HR', 'ADMIN')),
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Applications table
  await run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      application_no TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      otp_code TEXT,
      otp_expires_at DATETIME,
      is_email_verified INTEGER DEFAULT 0,
      user_id TEXT,
      candidate_id TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'NEEDS_REVIEW')),
      role_applied TEXT,
      employment_type TEXT,
      experience_type TEXT,
      personal_data TEXT, -- JSON
      job_data TEXT,      -- JSON
      experience_data TEXT, -- JSON
      internship_data TEXT, -- JSON
      education_data TEXT,  -- JSON
      skills_data TEXT,     -- JSON
      resume_file TEXT,
      profile_photo TEXT,
      current_step INTEGER DEFAULT 1,
      risk_score INTEGER DEFAULT 0,
      overall_status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Candidates table (Linked after account activation)
  await run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      candidate_ref_id TEXT UNIQUE NOT NULL, -- e.g. CT-2026-XXXXXX
      user_id TEXT UNIQUE,
      application_id TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      current_location TEXT,
      preferred_location TEXT,
      profile_photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Identity Verifications table
  await run(`
    CREATE TABLE IF NOT EXISTS identity_verifications (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      legal_first_name TEXT,
      legal_last_name TEXT,
      dob TEXT,
      govt_id_type TEXT,
      govt_id_masked TEXT,
      govt_id_hash TEXT,
      govt_doc_path TEXT,
      verification_status TEXT DEFAULT 'Verified',
      confidence_score REAL DEFAULT 0.95,
      notes TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  // Biometric / Face Verifications table
  await run(`
    CREATE TABLE IF NOT EXISTS biometric_verifications (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      capture_count INTEGER DEFAULT 4,
      photo_paths TEXT, -- JSON array of photos
      pose_compliance TEXT DEFAULT 'Straight Facing Passed',
      face_consistency_score REAL DEFAULT 0.98,
      liveness_score REAL DEFAULT 0.96,
      face_match_status TEXT DEFAULT 'Verified',
      verification_status TEXT DEFAULT 'Verified',
      notes TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  // Device & IP Signals table
  await run(`
    CREATE TABLE IF NOT EXISTS device_signals (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      ip_address TEXT,
      approx_location TEXT,
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      session_identifier TEXT,
      is_vpn_or_proxy INTEGER DEFAULT 0,
      sudden_ip_changed INTEGER DEFAULT 0,
      risk_flags TEXT, -- JSON array of detected signals
      risk_level TEXT DEFAULT 'LOW',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  // Synthetic Identity Signals table
  await run(`
    CREATE TABLE IF NOT EXISTS synthetic_identity_signals (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      name_dob_consistency TEXT DEFAULT 'MATCHED',
      govt_id_consistency TEXT DEFAULT 'VALID_CHECKSUM',
      phone_reputation TEXT DEFAULT 'HIGH_TRUST',
      email_reputation TEXT DEFAULT 'VALID_ACTIVE',
      account_age_signal TEXT DEFAULT 'NEW_APPLICATION',
      composite_status TEXT DEFAULT 'Verified', -- 'Verified' | 'Needs Review'
      composite_score INTEGER DEFAULT 95,
      signal_details TEXT, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  // Assessments table
  await run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      assessment_id TEXT UNIQUE NOT NULL, -- e.g. ASM-2026-XXXXXX
      title TEXT NOT NULL,
      job_role TEXT,
      candidate_id TEXT,
      application_id TEXT,
      scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
      window_start_time TEXT NOT NULL, -- e.g. "10:00 AM" or "10:00"
      window_end_time TEXT NOT NULL, -- e.g. "12:00 PM" or "12:00"
      duration_minutes INTEGER DEFAULT 60,
      instructions TEXT,
      questions_data TEXT, -- JSON array of questions
      policy_data TEXT, -- JSON proctoring policies
      passing_score INTEGER DEFAULT 60,
      created_by TEXT,
      status TEXT DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Assessment Attempts table
  await run(`
    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id TEXT PRIMARY KEY,
      attempt_id TEXT UNIQUE NOT NULL, -- e.g. ATT-2026-XXXXXX
      assessment_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      user_id TEXT,
      candidate_name TEXT,
      candidate_email TEXT,
      status TEXT DEFAULT 'IN_PROGRESS' CHECK(status IN ('IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'INTERRUPTED')),
      block_reason TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      remaining_seconds INTEGER,
      score INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 100,
      percentage REAL DEFAULT 0.0,
      answers_data TEXT, -- JSON array
      warning_counts TEXT, -- JSON { tabSwitches: 0, fullscreenExits: 0, voiceDetections: 0, networkInterruptions: 0, copyPasteAttempts: 0 }
      security_events_count INTEGER DEFAULT 0,
      security_summary TEXT DEFAULT 'Verified' CHECK(security_summary IN ('Verified', 'Needs Review', 'Blocked')),
      recording_url TEXT,
      network_interruption_log TEXT, -- JSON
      hr_review TEXT, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    )
  `);

  // Assessment Security Events table
  await run(`
    CREATE TABLE IF NOT EXISTS assessment_security_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      attempt_id TEXT NOT NULL,
      candidate_id TEXT,
      assessment_id TEXT,
      event_type TEXT NOT NULL,
      severity TEXT DEFAULT 'MEDIUM' CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      metadata TEXT, -- JSON
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id)
    )
  `);

  // Notifications table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      notification_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      candidate_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'SYSTEM',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Resume Analysis & Inconsistency Intelligence table
  await run(`
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      candidate_id TEXT,
      resume_file TEXT,
      extracted_resume_data TEXT, -- JSON
      inconsistencies TEXT,       -- JSON array of 7 categories
      consistency_checks TEXT,    -- JSON
      overall_status TEXT DEFAULT 'Consistent', -- 'Consistent' | 'Minor Inconsistency' | 'Needs Review' | 'Inconsistency Detected'
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  // Ensure stage columns exist in applications and candidates
  try {
    await run(`ALTER TABLE applications ADD COLUMN current_stage TEXT DEFAULT 'Resume Analysis'`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE applications ADD COLUMN recruitment_status TEXT DEFAULT 'In Progress'`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE applications ADD COLUMN resume_data TEXT`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE applications ADD COLUMN resume_analysis TEXT`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE applications ADD COLUMN workflow_stages TEXT`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE candidates ADD COLUMN current_stage TEXT DEFAULT 'Resume Analysis'`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE candidates ADD COLUMN recruitment_status TEXT DEFAULT 'In Progress'`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE assessment_attempts ADD COLUMN hr_review TEXT`);
  } catch (e) {}

  console.log('Database tables initialized successfully with Assessment, Proctoring, and Resume Inconsistency Analysis support.');
};

export default db;

