import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  type: { type: String, enum: ['MULTIPLE_CHOICE', 'CODE_SNIPPET', 'TECHNICAL_REASONING'], default: 'MULTIPLE_CHOICE' },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true }, // 0-indexed
  points: { type: Number, default: 10 },
  explanation: String
}, { _id: false });

const AssessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, unique: true, required: true }, // e.g. ASM-2026-102941
  title: { type: String, required: true },
  jobRole: { type: String, required: true },
  candidateId: { type: String }, // specific candidate or all candidates for role
  applicationId: { type: String },
  
  // Flexible Window Scheduling (e.g. Date: 15/10/2026, Window: 10:00 AM - 12:00 PM, Duration: 60m)
  scheduledDate: { type: String, required: true }, // YYYY-MM-DD
  windowStartTime: { type: String, required: true }, // e.g. "10:00 AM" or "10:00"
  windowEndTime: { type: String, required: true }, // e.g. "12:00 PM" or "12:00"
  durationMinutes: { type: Number, default: 60, required: true },
  instructions: { type: String, default: 'Please ensure your camera and microphone are active in a well-lit, quiet room. Fullscreen is enforced.' },
  
  questions: [QuestionSchema],
  passingScore: { type: Number, default: 60 },
  
  // Proctoring Violation Rules & Policy Config
  policy: {
    maxTabSwitches: { type: Number, default: 3 },
    maxVoiceWarnings: { type: Number, default: 3 },
    maxNetworkInterruptions: { type: Number, default: 3 },
    maxFullscreenExits: { type: Number, default: 3 },
    maxCopyPasteAttempts: { type: Number, default: 3 },
    recoveryWindowMinutes: { type: Number, default: 3 },
    recordSession: { type: Boolean, default: true }
  },
  
  createdBy: { type: String, default: 'HR Manager' },
  status: { type: String, enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'], default: 'SCHEDULED' }
}, {
  timestamps: true
});

export const Assessment = mongoose.model('Assessment', AssessmentSchema);

