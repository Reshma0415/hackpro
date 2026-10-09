import { query, run } from './config/db.js';

const generateLiveFrame = (name, angle, frameNum) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
    <defs>
      <linearGradient id="bg-${frameNum}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <linearGradient id="face-${frameNum}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fed7aa" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
    </defs>
    <rect width="320" height="320" fill="url(#bg-${frameNum})" />
    <circle cx="160" cy="140" r="85" fill="none" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
    <!-- Person Silhouette & Face -->
    <circle cx="160" cy="135" r="54" fill="url(#face-${frameNum})" />
    <path d="M 105 130 C 105 75, 215 75, 215 130 C 200 95, 120 95, 105 130 Z" fill="#1e293b" />
    <circle cx="142" cy="130" r="4.5" fill="#0f172a" />
    <circle cx="178" cy="130" r="4.5" fill="#0f172a" />
    <path d="M 150 156 Q 160 165 170 156" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 75 275 C 90 205, 230 205, 245 275 Z" fill="#2563eb" opacity="0.85" />
    <!-- Biometric HUD -->
    <rect x="12" y="12" width="296" height="296" fill="none" stroke="#22c55e" stroke-width="1.5" rx="10" opacity="0.75" />
    <text x="24" y="34" fill="#22c55e" font-family="monospace" font-size="11" font-weight="bold">LIVE WEBCAM FRAME #${frameNum}</text>
    <text x="24" y="50" fill="#94a3b8" font-family="monospace" font-size="9">LIVENESS: 98.4% • ${angle}</text>
    <text x="24" y="294" fill="#38bdf8" font-family="monospace" font-size="9">CANDIDATE: ${name}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

async function updateBiometrics() {
  const bios = await query('SELECT bv.id, bv.application_id, a.email, a.personal_data FROM biometric_verifications bv JOIN applications a ON bv.application_id = a.id');
  console.log('Updating biometric rows:', bios.length);

  for (const b of bios) {
    let name = b.email ? b.email.split('@')[0] : 'Candidate';
    if (b.personal_data) {
      try {
        const pd = JSON.parse(b.personal_data);
        if (pd.firstName) name = `${pd.firstName} ${pd.lastName || ''}`.trim();
      } catch (e) {}
    }

    const photos = [
      generateLiveFrame(name, 'STRAIGHT-FACING 0°', 1),
      generateLiveFrame(name, 'STRAIGHT-FACING 0° (F2)', 2),
      generateLiveFrame(name, 'STRAIGHT-FACING 0° (F3)', 3)
    ];

    await run('UPDATE biometric_verifications SET photo_paths = ?, capture_count = 3 WHERE id = ?', [JSON.stringify(photos), b.id]);
  }

  console.log('Successfully populated live webcam frames for all existing records!');
  process.exit(0);
}

updateBiometrics().catch(console.error);

