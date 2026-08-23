const mongoose = require('mongoose');

const seatLockSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  seatNumber: {
    type: Number,
    required: true
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Automatic document deletion in MongoDB
  }
}, { timestamps: true });

// Ensure unique seat locking per ride
seatLockSchema.index({ ride: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('SeatLock', seatLockSchema);
