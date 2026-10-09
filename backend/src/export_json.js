import { query } from './config/db.js';
import fs from 'fs';
import path from 'path';

async function exportCandidateData() {
  const apps = await query(`
    SELECT 
      a.id,
      a.application_no,
      a.candidate_id,
      a.email,
      a.role_applied,
      a.overall_status,
      a.personal_data,
      a.education_data,
      a.skills_data,
      a.profile_photo,
      bv.photo_paths as live_photos_json,
      bv.liveness_score,
      bv.verification_status as biometric_status,
      iv.govt_id_masked,
      iv.dob,
      ds.ip_address,
      ds.approx_location
    FROM applications a
    LEFT JOIN biometric_verifications bv ON a.id = bv.application_id
    LEFT JOIN identity_verifications iv ON a.id = iv.application_id
    LEFT JOIN device_signals ds ON a.id = ds.application_id
    ORDER BY a.created_at DESC
  `);

  const formatted = apps.map(app => ({
    applicationNo: app.application_no,
    candidateId: app.candidate_id,
    email: app.email,
    roleApplied: app.role_applied,
    overallStatus: app.overall_status,
    personalDetails: app.personal_data ? JSON.parse(app.personal_data) : {},
    educationDetails: app.education_data ? JSON.parse(app.education_data) : {},
    skills: app.skills_data ? JSON.parse(app.skills_data) : [],
    govtIdMasked: app.govt_id_masked,
    dateOfBirth: app.dob,
    networkLocation: {
      ip: app.ip_address,
      location: app.approx_location
    },
    profilePhoto: app.profile_photo ? (app.profile_photo.slice(0, 50) + '... [Base64 Image Data]') : 'None',
    liveWebcamPhotos: app.live_photos_json ? JSON.parse(app.live_photos_json).map((p, i) => `Live Photo #${i + 1}: ${p.slice(0, 45)}... [Base64 Image Data]`) : []
  }));

  const exportPath = path.resolve('candidate_data_export.json');
  fs.writeFileSync(exportPath, JSON.stringify(formatted, null, 2));
  console.log('Successfully created human-readable JSON export at:', exportPath);
  process.exit(0);
}

exportCandidateData().catch(console.error);

