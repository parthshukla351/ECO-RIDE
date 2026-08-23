const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone must be 10 digits']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  autoShare: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure unique phone number per user
emergencyContactSchema.index({ user: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
