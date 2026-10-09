import { query } from './config/db.js';
import mongoose from 'mongoose';
import { CandidateApplication } from './models/CandidateApplication.js';
import { connectMongoDB } from './config/mongo.js';

async function check() {
  const apps = await query("SELECT id, application_no, candidate_id, email, profile_photo, personal_data FROM applications WHERE LOWER(email) LIKE '%reshma%' OR LOWER(personal_data) LIKE '%reshma%'");
  console.log('SQLite Reshma Apps count:', apps.length);
  for (const a of apps) {
    console.log('App:', a.id, a.application_no, a.email, 'ProfilePhoto len:', a.profile_photo?.length, 'Photo preview:', a.profile_photo?.slice(0, 50));
    const bio = await query('SELECT * FROM biometric_verifications WHERE application_id = ?', [a.id]);
    console.log('Bio for App:', a.id, 'Photo paths len:', bio[0]?.photo_paths?.length, 'Snippet:', bio[0]?.photo_paths?.slice(0, 80));
  }

  try {
    await connectMongoDB();
    const mongoApps = await CandidateApplication.find({ email: /reshma/i });
    console.log('MongoDB Reshma Apps count:', mongoApps.length);
    for (const ma of mongoApps) {
      console.log('Mongo App:', ma.applicationId, ma.email, 'profilePhoto len:', ma.profilePhoto?.length, 'photoPaths len:', ma.identityVerification?.photoPaths?.length);
    }
  } catch (err) {
    console.warn('Mongo check error:', err.message);
  }
  process.exit(0);
}

check().catch(console.error);

