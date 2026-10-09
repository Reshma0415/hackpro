import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  selectedOption: { type: Number },
  isCorrect: { type: Boolean, default: false },
  timeSpentSeconds: { type: Number, default: 0 }
}, { _id: false });

const NetworkInterruptionSchema = new mongoose.Schema({
  disconnectedAt: { type: Date, required: true },
  reconnectedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  resolvedWithinRecoveryWindow: { type: Boolean, default: true }
}, { _id: false });

const AssessmentAttemptSchema = new mongoose.Schema({
  attemptId: { type: String, unique: true, required: true }, // e.g. ATT-2026-894102
  assessmentId: { type: String, required: true },
  candidateId: { type: String, required: true },
  userId: { type: String },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'INTERRUPTED'],
    default: 'IN_PROGRESS'
  },
  blockReason: { type: String },
  
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  remainingSeconds: { type: Number },
  
  score: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 100 },
  percentage: { type: Number, default: 0 },
  answers: [AnswerSchema],
  
  // Proctoring Violations Counters
  warningCounts: {
    tabSwitches: { type: Number, default: 0 },
    fullscreenExits: { type: Number, default: 0 },
    voiceDetections: { type: Number, default: 0 },
    networkInterruptions: { type: Number, default: 0 },
    copyPasteAttempts: { type: Number, default: 0 }
  },
  
  securityEventsCount: { type: Number, default: 0 },
  securitySummary: {
    type: String,
    enum: ['Verified', 'Needs Review', 'Blocked'],
    default: 'Verified'
  },
  
  recordingUrl: { type: String },
  networkInterruptionLog: [NetworkInterruptionSchema],
  
  hrReview: {
    reviewedBy: String,
    reviewedAt: Date,
    decision: { type: String, enum: ['APPROVED', 'FLAGGED', 'RETEST_ALLOWED', 'REJECTED', 'PENDING'], default: 'PENDING' },
    notes: String
  }
}, {
  timestamps: true
});

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', AssessmentAttemptSchema);

