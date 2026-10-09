import mongoose from 'mongoose';

const ExperienceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  yearsOfExperience: { type: String },
  startDate: { type: String, required: true },
  endDate: { type: String },
  currentlyWorking: { type: Boolean, default: false },
  employmentType: { type: String, default: 'Full Time' },
  managerName: { type: String },
  managerContact: { type: String },
  responsibilities: { type: String },
  technologies: { type: String },
  experienceCertificate: { type: String }
}, { _id: false });

const InternshipSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  internshipRole: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  paid: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' },
  workMode: { type: String, default: 'Hybrid' },
  managerMentor: { type: String },
  contactDetails: { type: String },
  technologies: { type: String },
  responsibilities: { type: String },
  internshipCertificate: { type: String }
}, { _id: false });

const CandidateApplicationSchema = new mongoose.Schema({
  candidateId: { type: String, unique: true, required: true }, // e.g., CT-2026-123456
  applicationId: { type: String, unique: true, required: true }, // e.g., APP-2026-123456
  
  // Basic Details
  jobRole: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },

  // Education Details
  education: {
    tenth: {
      school: String,
      board: String,
      year: String,
      percentage: String,
      marksheet: String
    },
    twelfth: {
      school: String,
      board: String,
      year: String,
      percentage: String,
      marksheet: String
    },
    college: {
      collegeName: String,
      degree: String,
      branch: String,
      university: String,
      cgpa: String,
      graduationYear: String,
      marksheet: String
    }
  },

  // Experience & Internships
  hasWorkExperience: { type: Boolean, default: false },
  experience: [ExperienceSchema],
  hasInternship: { type: Boolean, default: false },
  internships: [InternshipSchema],

  // Skills & Resume Metadata
  skills: [{
    name: String,
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] }
  }],
  resume: {
    originalName: String,
    storedName: String,
    filePath: String,
    fileName: String,
    fileUrl: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },

  // Identity Data (STRICT PRIVACY: NEVER STORE FULL AADHAAR)
  profilePhoto: String,
  livePhotos: [{ type: String }],
  dateOfBirth: String,
  aadhaarLast4: { type: String, required: true }, // e.g. "9012"
  aadhaarMasked: { type: String, required: true }, // e.g. "XXXX XXXX 9012"
  
  identityVerification: {
    status: { type: String, default: 'Verified' },
    faceMatch: { type: Boolean, default: true },
    faceConsistencyScore: { type: Number, default: 0.98 },
    livenessDemo: { type: Boolean, default: true },
    captureCount: { type: Number, default: 3 },
    poseCompliance: { type: String, default: 'Straight Facing 100% Compliant' },
    isAadhaarOtpVerified: { type: Boolean, default: true },
    photoPaths: [{ type: String }],
    livePhotos: [{ type: String }],
    verifiedAt: { type: Date, default: Date.now }
  },

  // Security & Telemetry Signals
  securitySignals: {
    ipAddress: String,
    approxLocation: String,
    browser: String,
    os: String,
    deviceType: String,
    isVpnOrProxy: Boolean,
    riskLevel: { type: String, default: 'LOW' }
  },

  // Extracted Structured Resume Data (Kept separate from Application Data)
  resumeData: {
    candidateName: String,
    email: String,
    phone: String,
    totalExperienceYears: String,
    skills: [{
      name: String,
      proficiency: String,
      yearsExperience: String
    }],
    education: [{
      degree: String,
      college: String,
      university: String,
      graduationYear: String,
      cgpa: String,
      startDate: String,
      endDate: String
    }],
    experience: [{
      companyName: String,
      jobRole: String,
      startDate: String,
      endDate: String,
      currentlyWorking: Boolean,
      employmentType: String,
      responsibilities: String,
      technologies: String
    }],
    internships: [{
      companyName: String,
      internshipRole: String,
      startDate: String,
      endDate: String,
      paid: String,
      workMode: String,
      technologies: String,
      responsibilities: String
    }],
    projects: [{
      title: String,
      technologies: String,
      description: String,
      duration: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: String,
      credentialId: String
    }],
    rawTextSummary: String
  },

  // Inconsistency Intelligence Analysis Report
  resumeAnalysis: {
    status: { type: String, default: 'Pending' }, // 'Consistent' | 'Minor Inconsistency' | 'Needs Review' | 'Inconsistency Detected' | 'Completed'
    inconsistencies: [{
      id: String,
      category: String, // 'Employment Date' | 'Job Role' | 'Skill Verification' | 'Education Degree' | 'Project Information' | 'Certifications' | 'Employer / Company Name'
      applicationValue: String,
      resumeValue: String,
      reason: String,
      severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      recommendedAction: { type: String, default: 'Needs Review' }
    }],
    totalInconsistencies: { type: Number, default: 0 },
    consistencyChecks: {
      skillsConsistency: { type: String, default: 'Consistent' },
      experienceDateConsistency: { type: String, default: 'Consistent' },
      educationConsistency: { type: String, default: 'Consistent' },
      projectConsistency: { type: String, default: 'Consistent' },
      credentialConsistency: { type: String, default: 'Consistent' }
    },
    overallStatus: { type: String, default: 'Consistent' },
    analyzedAt: { type: Date }
  },

  // 7-Stage Candidate Recruitment Lifecycle
  // Order: 1. Apply -> 2. Identity -> 3. Resume Analysis -> 4. Assessment -> 5. Interview -> 6. Offer -> 7. Onboarding
  workflowStages: {
    apply: { status: { type: String, default: 'Completed' }, completedAt: Date },
    identity: { status: { type: String, default: 'Completed' }, completedAt: Date },
    resumeAnalysis: { status: { type: String, default: 'Completed' }, completedAt: Date },
    assessment: { status: { type: String, default: 'Not Started' }, completedAt: Date },
    interview: { status: { type: String, default: 'Not Started' }, completedAt: Date },
    offer: { status: { type: String, default: 'Not Started' }, completedAt: Date },
    onboarding: { status: { type: String, default: 'Not Started' }, completedAt: Date }
  },

  // Recruitment Lifecycle & Stages
  currentStage: {
    type: String,
    enum: [
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
    ],
    default: 'Resume Analysis'
  },
  recruitmentStatus: { type: String, default: 'In Progress' },
  stageHistory: [{
    stage: String,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now },
    notes: String
  }],
  assessmentDetails: {
    assessmentId: String,
    title: String,
    scheduledDate: String,
    windowStartTime: String,
    windowEndTime: String,
    durationMinutes: Number,
    instructions: String,
    status: { type: String, default: 'NOT_SCHEDULED' }
  },
  interviewDetails: {
    scheduledAt: Date,
    mode: { type: String, default: 'Online Video' },
    meetingLink: String,
    interviewerNotes: String,
    status: { type: String, default: 'Not Scheduled' }
  },
  offerDetails: {
    status: { type: String, default: 'Pending' }, // 'Pending' | 'Generated' | 'Accepted' | 'Declined'
    salary: String,
    designation: String,
    joiningDate: String,
    offerLetterUrl: String,
    notes: String
  },
  onboardingDetails: {
    status: { type: String, default: 'Not Started' }, // 'Not Started' | 'In Progress' | 'Completed'
    documentsSubmitted: { type: Boolean, default: false },
    checklist: [{ item: String, completed: Boolean }],
    completionPercentage: { type: Number, default: 0 }
  },
  finalDecision: {
    status: { type: String, enum: ['Selected', 'Rejected', 'Pending'], default: 'Pending' },
    decidedBy: String,
    decidedAt: Date,
    notes: String
  },

  applicationStatus: { type: String, default: 'Submitted' },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const CandidateApplication = mongoose.model('CandidateApplication', CandidateApplicationSchema);
