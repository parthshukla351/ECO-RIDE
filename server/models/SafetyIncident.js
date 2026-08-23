const mongoose = require('mongoose');

const safetyIncidentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  status: {
    type: String,
    enum: ['TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED'],
    default: 'TRIGGERED'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number
  },
  resolvedAt: Date,
  resolutionNotes: String
}, { timestamps: true });

module.exports = mongoose.model('SafetyIncident', safetyIncidentSchema);
