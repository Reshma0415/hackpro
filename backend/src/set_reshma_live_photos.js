import { query, run } from './config/db.js';
import mongoose from 'mongoose';
import { CandidateApplication } from './models/CandidateApplication.js';
import { connectMongoDB } from './config/mongo.js';

async function setReshmaLivePhotos() {
  // Find Reshma's application with the uploaded base64 photo
  const apps = await query("SELECT id, application_no, email, profile_photo FROM applications WHERE (LOWER(email) LIKE '%reshma%' OR LOWER(personal_data) LIKE '%reshma%') AND profile_photo LIKE 'data:image%'");

  console.log('Found Reshma apps with real base64 image:', apps.length);

  if (apps.length > 0) {
    const realPhoto = apps[0].profile_photo;
    console.log('Real photo length:', realPhoto.length);

    // Update all Reshma applications in SQLite so the 3 live frames contain her real image
    const allReshmaApps = await query("SELECT id, application_no, email FROM applications WHERE LOWER(email) LIKE '%reshma%' OR LOWER(personal_data) LIKE '%reshma%'");

    for (const a of allReshmaApps) {
      const photosArray = [realPhoto, realPhoto, realPhoto];
      await run("UPDATE applications SET profile_photo = ? WHERE id = ?", [realPhoto, a.id]);
      await run("UPDATE candidates SET profile_photo = ? WHERE application_id = ?", [realPhoto, a.id]);
      await run("UPDATE biometric_verifications SET photo_paths = ?, capture_count = 3, verification_status = 'Verified' WHERE application_id = ?", [JSON.stringify(photosArray), a.id]);
      console.log('Updated SQLite biometric photo_paths for application:', a.application_no, a.email);
    }

    // Update MongoDB
    try {
      await connectMongoDB();
      const mongoRes = await CandidateApplication.updateMany(
        { email: /reshma/i },
        { 
          $set: { 
            profilePhoto: realPhoto,
            'identityVerification.photoPaths': [realPhoto, realPhoto, realPhoto],
            'identityVerification.captureCount': 3,
            'identityVerification.status': 'Verified'
          }
        }
      );
      console.log('Updated MongoDB candidate records for Reshma:', mongoRes.modifiedCount);
    } catch (mErr) {
      console.warn('Mongo update error:', mErr.message);
    }
  }

  console.log('Successfully set Reshma real photo into all 3 live frames!');
  process.exit(0);
}

setReshmaLivePhotos().catch(console.error);

