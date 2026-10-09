import mongoose from 'mongoose';

const AssessmentSecurityEventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true, required: true }, // e.g. EVT-2026-XXXXXX
  attemptId: { type: String, required: true },
  candidateId: { type: String },
  assessmentId: { type: String },
  
  eventType: {
    type: String,
    enum: [
      'TAB_SWITCH',
      'WINDOW_FOCUS_LOST',
      'FULLSCREEN_EXIT',
      'COPY_ATTEMPT',
      'PASTE_ATTEMPT',
      'CUT_ATTEMPT',
      'RIGHT_CLICK_ATTEMPT',
      'CAMERA_DISABLED',
      'MICROPHONE_DISABLED',
      'NO_FACE_DETECTED',
      'MULTIPLE_FACE_DETECTED',
      'NETWORK_DISCONNECTED',
      'NETWORK_RECONNECTED',
      'BACKGROUND_VOICE_DETECTED',
      'ASSESSMENT_BLOCKED'
    ],
    required: true
  },
  
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

export const AssessmentSecurityEvent = mongoose.model('AssessmentSecurityEvent', AssessmentSecurityEventSchema);

