import { query } from './config/db.js';

async function show() {
  const data = await query(`
    SELECT 
      a.application_no, 
      a.email, 
      a.role_applied, 
      a.overall_status,
      a.created_at,
      CASE WHEN a.profile_photo IS NOT NULL AND a.profile_photo != '' THEN 'Stored (' || substr(a.profile_photo, 1, 25) || '...)' ELSE 'None' END as profile_photo_status,
      bv.capture_count,
      CASE WHEN bv.photo_paths IS NOT NULL THEN '3 Live Frames Stored' ELSE 'None' END as live_photos_status
    FROM applications a
    LEFT JOIN biometric_verifications bv ON a.id = bv.application_id
    ORDER BY a.created_at DESC
  `);
  console.table(data);
  process.exit(0);
}

show().catch(console.error);

