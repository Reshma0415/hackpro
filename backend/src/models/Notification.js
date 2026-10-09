import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, unique: true, required: true },
  userId: { type: String },
  candidateId: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['STAGE_UPDATE', 'ASSESSMENT_SCHEDULED', 'ASSESSMENT_COMPLETED', 'REVIEW_REQUIRED', 'SYSTEM'],
    default: 'STAGE_UPDATE'
  },
  read: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Notification = mongoose.model('Notification', NotificationSchema);

