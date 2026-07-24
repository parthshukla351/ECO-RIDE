const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'booking_confirmed', 'booking_cancelled', 'booking_rejected',
      'ride_started', 'ride_completed', 'ride_cancelled',
      'payment_success', 'payment_failed', 'refund_processed',
      'new_message', 'review_received',
      'eco_badge_earned', 'eco_level_up',
      'sos_alert', 'system', 'promotion'
    ],
    required: true
  },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);