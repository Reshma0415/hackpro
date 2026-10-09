import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDb, run, get } from './config/db.js';
import { maskGovtId, hashGovtId } from './services/riskEngine.js';

export const seedDatabase = async () => {
  await initDb();

  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash('Demo@1234', saltRounds);

  // 1. Seed HR Account
  const hrExists = await get('SELECT id FROM users WHERE email = ?', ['hr@demo.com']);
  if (!hrExists) {
    const hrId = uuidv4();
    await run(
      `INSERT INTO users (id, username, email, phone, password_hash, role, status)
       VALUES (?, 'hrmanager', 'hr@demo.com', '+91 98765 43210', ?, 'HR', 'ACTIVE')`,
      [hrId, defaultPasswordHash]
    );
    console.log('Seeded HR user: hr@demo.com / Demo@1234');
  }

  // 2. Seed Admin Account
  const adminExists = await get('SELECT id FROM users WHERE email = ?', ['admin@demo.com']);
  if (!adminExists) {
    const adminId = uuidv4();
    await run(
      `INSERT INTO users (id, username, email, phone, password_hash, role, status)
       VALUES (?, 'admin', 'admin@demo.com', '+91 98765 00000', ?, 'ADMIN', 'ACTIVE')`,
      [adminId, defaultPasswordHash]
    );
    console.log('Seeded Admin user: admin@demo.com / Demo@1234');
  }

  // 3. Seed Demo Candidate 1: Alex Morgan (Fully Verified)
  const candidateEmail = 'candidate@demo.com';
  const candExists = await get('SELECT id FROM users WHERE email = ?', [candidateEmail]);
  if (!candExists) {
    const candUserId = uuidv4();
    const candAppId = uuidv4();
    const candId = uuidv4();
    const candidateRefId = 'CT-2026-784920';

    await run(
      `INSERT INTO users (id, username, email, phone, password_hash, role, status)
       VALUES (?, 'alex_morgan', ?, '+91 91234 56789', ?, 'CANDIDATE', 'ACTIVE')`,
      [candUserId, candidateEmail, defaultPasswordHash]
    );

    const personalData = {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: candidateEmail,
      phone: '+91 91234 56789',
      currentLocation: 'Bengaluru, India',
      preferredLocation: 'Bengaluru / Remote',
      address: '42 Tech Residency, Indiranagar, Bengaluru'
    };

    const jobData = {
      jobRole: 'Senior Full Stack Engineer',
      employmentType: 'Full Time',
      experienceType: 'Experienced'
    };

    const experienceData = [
      {
        companyName: 'Apex Cloud Solutions',
        jobTitle: 'Full Stack Developer',
        employmentType: 'Full Time',
        startDate: '2023-01',
        endDate: '2026-02',
        currentlyWorking: false,
        yearsOfExperience: '3.1',
        responsibilities: 'Architected microservices, managed cloud pipelines, and built high-performance React frontends.',
        technologies: 'React, Node.js, PostgreSQL, Docker, AWS',
        verificationContact: 'hr@apexcloud.io'
      }
    ];

    const internshipData = [
      {
        completedInternship: 'Yes',
        company: 'Vanguard Systems',
        role: 'Software Engineering Intern',
        startDate: '2022-05',
        endDate: '2022-11',
        paid: 'Paid',
        workMode: 'Hybrid',
        technologies: 'JavaScript, Python, FastAPI',
        responsibilities: 'Built automated test suites and backend analytics APIs.'
      }
    ];

    const educationData = {
      tenth: {
        school: 'St. Joseph High School',
        board: 'CBSE',
        passingYear: '2018',
        percentage: '94%'
      },
      twelfth: {
        school: 'Delhi Public School',
        board: 'CBSE',
        passingYear: '2020',
        percentage: '92.5%'
      },
      college: {
        degree: 'B.Tech in Computer Science',
        branch: 'Computer Science & Engineering',
        college: 'National Institute of Technology',
        university: 'NIT',
        startYear: '2020',
        graduationYear: '2024',
        cgpa: '8.8 / 10'
      }
    };

    const skillsData = [
      { name: 'React.js', level: 'Advanced' },
      { name: 'Node.js / Express', level: 'Advanced' },
      { name: 'TypeScript', level: 'Intermediate' },
      { name: 'PostgreSQL', level: 'Intermediate' },
      { name: 'Cloud & Docker', level: 'Intermediate' }
    ];

    await run(
      `INSERT INTO applications (
        id, application_no, email, is_email_verified, user_id, candidate_id, status, 
        role_applied, employment_type, experience_type, personal_data, job_data, 
        experience_data, internship_data, education_data, skills_data, current_step, 
        risk_score, overall_status
      ) VALUES (?, 'APP-928410', ?, 1, ?, ?, 'SUBMITTED', 'Senior Full Stack Engineer', 'Full Time', 'Experienced', ?, ?, ?, ?, ?, ?, 6, 4, 'Verified')`,
      [
        candAppId,
        candidateEmail,
        candUserId,
        candidateRefId,
        JSON.stringify(personalData),
        JSON.stringify(jobData),
        JSON.stringify(experienceData),
        JSON.stringify(internshipData),
        JSON.stringify(educationData),
        JSON.stringify(skillsData)
      ]
    );

    await run(
      `INSERT INTO candidates (id, candidate_ref_id, user_id, application_id, first_name, last_name, email, phone, current_location, preferred_location)
       VALUES (?, ?, ?, ?, 'Alex', 'Morgan', ?, '+91 91234 56789', 'Bengaluru, India', 'Bengaluru / Remote')`,
      [candId, candidateRefId, candUserId, candAppId, candidateEmail]
    );

    // Identity Verification record
    await run(
      `INSERT INTO identity_verifications (id, application_id, legal_first_name, legal_last_name, dob, govt_id_type, govt_id_masked, govt_id_hash, verification_status, confidence_score, is_demo)
       VALUES (?, ?, 'Alex', 'Morgan', '2001-04-14', 'Aadhaar', 'XXXX-XXXX-7492', ?, 'Verified', 0.98, 1)`,
      [uuidv4(), candAppId, hashGovtId('987654327492')]
    );

    // Biometric Verification record
    await run(
      `INSERT INTO biometric_verifications (id, application_id, capture_count, pose_compliance, face_consistency_score, liveness_score, face_match_status, verification_status, notes, is_demo)
       VALUES (?, ?, 4, 'Straight Facing 100% Passed', 0.98, 0.97, 'Verified', 'Verified', 'Multi-angle straight camera frames matched candidate profile (DEMO/MOCK).', 1)`,
      [uuidv4(), candAppId]
    );

    // Device Signals
    await run(
      `INSERT INTO device_signals (id, application_id, ip_address, approx_location, user_agent, device_type, browser, os, session_identifier, is_vpn_or_proxy, risk_flags, risk_level)
       VALUES (?, ?, '106.51.78.22', 'Bengaluru, Karnataka, IN', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0', 'Desktop', 'Chrome', 'Windows 11', 'sess_a98bc1', 0, '[]', 'LOW')`,
      [uuidv4(), candAppId]
    );

    // Seed an active scheduled assessment for demo candidate
    const asmId = uuidv4();
    const assessmentRefId = 'ASM-2026-784920';
    const todayStr = new Date().toISOString().split('T')[0];
    
    const sampleQuestions = [
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
    ];

    const policy = {
      maxTabSwitches: 3,
      maxVoiceWarnings: 3,
      maxNetworkInterruptions: 3,
      maxFullscreenExits: 3,
      maxCopyPasteAttempts: 3,
      recoveryWindowMinutes: 3,
      recordSession: true
    };

    await run(
      `INSERT INTO assessments (
        id, assessment_id, title, job_role, candidate_id, application_id, scheduled_date,
        window_start_time, window_end_time, duration_minutes, instructions, questions_data,
        policy_data, created_by, status
      ) VALUES (?, ?, 'Full Stack Engineering Competency Assessment', 'Senior Full Stack Engineer', ?, ?, ?, '09:00 AM', '11:59 PM', 60, 'Camera & microphone must be active. Fullscreen is enforced.', ?, ?, 'hr@demo.com', 'SCHEDULED')`,
      [
        asmId,
        assessmentRefId,
        candidateRefId,
        candAppId,
        todayStr,
        JSON.stringify(sampleQuestions),
        JSON.stringify(policy)
      ]
    );

    // Update candidate stage to Assessment Scheduled
    await run(
      `UPDATE applications SET current_stage = 'Assessment Scheduled', recruitment_status = 'Assessment Scheduled' WHERE id = ?`,
      [candAppId]
    );
    await run(
      `UPDATE candidates SET current_stage = 'Assessment Scheduled', recruitment_status = 'Assessment Scheduled' WHERE id = ?`,
      [candId]
    );

    // Seed Welcome Notification
    await run(
      `INSERT INTO notifications (id, notification_id, user_id, candidate_id, title, message, type)
       VALUES (?, 'NOTIF-INIT-1', ?, ?, 'Assessment Scheduled for Today', 'Your Technical Assessment is scheduled for today with a flexible start window between 09:00 AM and 11:59 PM (60 mins duration).', 'ASSESSMENT_SCHEDULED')`,
      [uuidv4(), candUserId, candidateRefId]
    );

    console.log(`Seeded Demo Candidate: candidate@demo.com / Demo@1234 (ID: ${candidateRefId})`);
  }

  // Ensure default demo assessment exists
  const asmRefId = 'ASM-2026-784920';
  const asmExists = await get('SELECT id FROM assessments WHERE assessment_id = ?', [asmRefId]);
  if (!asmExists) {
    const asmId = uuidv4();
    const candidateRefId = 'CT-2026-784920';
    const cand = await get('SELECT id, user_id, application_id FROM candidates WHERE email = ? OR candidate_ref_id = ?', [candidateEmail, candidateRefId]);
    const todayStr = new Date().toISOString().split('T')[0];

    const sampleQuestions = [
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
    ];

    const policy = {
      maxTabSwitches: 3,
      maxVoiceWarnings: 3,
      maxNetworkInterruptions: 3,
      maxFullscreenExits: 3,
      maxCopyPasteAttempts: 3,
      recoveryWindowMinutes: 3,
      recordSession: true
    };

    await run(
      `INSERT INTO assessments (
        id, assessment_id, title, job_role, candidate_id, application_id, scheduled_date,
        window_start_time, window_end_time, duration_minutes, instructions, questions_data,
        policy_data, created_by, status
      ) VALUES (?, ?, 'Full Stack Engineering Competency Assessment', 'Senior Full Stack Engineer', ?, ?, ?, '09:00 AM', '11:59 PM', 60, 'Camera & microphone must be active. Fullscreen is enforced.', ?, ?, 'hr@demo.com', 'SCHEDULED')`,
      [
        asmId,
        asmRefId,
        candidateRefId,
        cand?.application_id || 'APP-928410',
        todayStr,
        JSON.stringify(sampleQuestions),
        JSON.stringify(policy)
      ]
    );

    // Update candidate stage to Assessment Scheduled
    await run(
      `UPDATE applications SET current_stage = 'Assessment Scheduled', recruitment_status = 'Assessment Scheduled' WHERE email = ?`,
      [candidateEmail]
    );
    await run(
      `UPDATE candidates SET current_stage = 'Assessment Scheduled', recruitment_status = 'Assessment Scheduled' WHERE email = ?`,
      [candidateEmail]
    );

    console.log(`Seeded Demo Scheduled Assessment (${asmRefId}) for candidate ${candidateEmail}`);
  }

  // 4. Seed Candidate 2: Priya Sharma (Flagged for "Needs Review" due to Device/IP anomaly)
  const candidate2Email = 'priya.sharma@demo.com';
  const cand2Exists = await get('SELECT id FROM applications WHERE email = ?', [candidate2Email]);
  if (!cand2Exists) {
    const cand2AppId = uuidv4();
    const candidate2RefId = 'CT-2026-319804';

    const personalData2 = {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: candidate2Email,
      phone: '+91 98877 66554',
      currentLocation: 'Mumbai, India',
      preferredLocation: 'Mumbai / Pune',
      address: '7th Floor, Cyber Hub, Bandra Kurla Complex'
    };

    const jobData2 = {
      jobRole: 'AI & Data Scientist',
      employmentType: 'Full Time',
      experienceType: 'Experienced'
    };

    const educationData2 = {
      tenth: { school: 'Delhi Public School', board: 'CBSE', passingYear: '2017', percentage: '91%' },
      twelfth: { school: 'St. Xavier Junior College', board: 'State Board', passingYear: '2019', percentage: '89%' },
      college: { degree: 'M.S. in Data Science', branch: 'Artificial Intelligence', college: 'IIT Bombay', university: 'IIT', startYear: '2019', graduationYear: '2024', cgpa: '9.2 / 10' }
    };

    await run(
      `INSERT INTO applications (
        id, application_no, email, is_email_verified, candidate_id, status, 
        role_applied, employment_type, experience_type, personal_data, job_data, 
        education_data, current_step, risk_score, overall_status
      ) VALUES (?, 'APP-410982', ?, 1, ?, 'SUBMITTED', 'AI & Data Scientist', 'Full Time', 'Experienced', ?, ?, ?, 6, 28, 'Needs Review')`,
      [
        cand2AppId,
        candidate2Email,
        candidate2RefId,
        JSON.stringify(personalData2),
        JSON.stringify(jobData2),
        JSON.stringify(educationData2)
      ]
    );

    // Identity
    await run(
      `INSERT INTO identity_verifications (id, application_id, legal_first_name, legal_last_name, dob, govt_id_type, govt_id_masked, govt_id_hash, verification_status, confidence_score, is_demo)
       VALUES (?, ?, 'Priya', 'Sharma', '2000-11-22', 'PAN', 'ABXXXXX891C', ?, 'Verified', 0.94, 1)`,
      [uuidv4(), cand2AppId, hashGovtId('ABCDE1234F')]
    );

    // Biometric
    await run(
      `INSERT INTO biometric_verifications (id, application_id, capture_count, pose_compliance, face_consistency_score, liveness_score, face_match_status, verification_status, notes, is_demo)
       VALUES (?, ?, 4, 'Straight Facing 100% Passed', 0.97, 0.94, 'Verified', 'Verified', 'Face straightness and landmarks compliant (DEMO/MOCK).', 1)`,
      [uuidv4(), cand2AppId]
    );

    // Device Signals with VPN flag (Supporting signal, not automatic fraud)
    await run(
      `INSERT INTO device_signals (id, application_id, ip_address, approx_location, user_agent, device_type, browser, os, session_identifier, is_vpn_or_proxy, risk_flags, risk_level)
       VALUES (?, ?, '185.220.101.5', 'Frankfurt, DE (Tor/VPN Relay)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'Firefox', 'macOS', 'sess_proxy77', 1, '["Datacenter / Commercial Proxy IP observed", "Geographic location mismatch with address"]', 'MODERATE')`,
      [uuidv4(), cand2AppId]
    );

    // Synthetic Signals
    await run(
      `INSERT INTO synthetic_identity_signals (id, application_id, name_dob_consistency, govt_id_consistency, phone_reputation, email_reputation, account_age_signal, composite_status, composite_score, signal_details)
       VALUES (?, ?, 'MATCHED', 'VALID_CHECKSUM', 'HIGH_TRUST', 'VALID_ACTIVE', 'NEW_APPLICATION', 'Needs Review', 72, '["Network route indicated commercial proxy relay", "Location signal deviation detected"]')`,
      [uuidv4(), cand2AppId]
    );

    console.log(`Seeded Candidate 2 (Needs Review): ${candidate2Email} (ID: ${candidate2RefId})`);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => {
    console.log('Database seeding finished.');
    process.exit(0);
  });
}

