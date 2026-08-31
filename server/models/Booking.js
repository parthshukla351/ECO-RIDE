const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seatsBooked: { type: Number, required: true, min: 1 },
  seats: [{ type: Number }],
  pricePerSeat: { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },

  paymentId: String,
  razorpayOrderId: String,

  pickupLocation: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  dropLocation: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },

  carbonSaved: { type: Number, default: 0 },
  ecoPointsEarned: { type: Number, default: 0 },

  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['driver', 'passenger', 'admin', 'system']
  },
  cancelledAt: Date,

  confirmedAt: Date,
  completedAt: Date,

  qrCode: String,
  isQrScanned: { type: Boolean, default: false },

  passengerRating: { type: Number, min: 1, max: 5 },
  driverRating: { type: Number, min: 1, max: 5 },

  // New features tracking
  isSharedRideCandidate: { type: Boolean, default: false },
  passengerApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'none'],
    default: 'none'
  },
  driverApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'none'],
    default: 'none'
  },
  sharedRideAdjustment: { type: Number, default: 0 },
  originalFare: { type: Number },
  trafficDelaySeconds: { type: Number, default: 0 },
  trafficCharge: { type: Number, default: 0 },
  passengerLateMinutes: { type: Number, default: 0 },
  passengerLateCharge: { type: Number, default: 0 },
  driverArrivedAt: Date,
  passengerArrivedAt: Date,

  // Detailed route-based fare splitting audit fields
  originalPassenger1Fare: { type: Number, default: 0 },
  passenger2RouteDistance: { type: Number, default: 0 },
  passenger2BaseFare: { type: Number, default: 0 },
  sharedDistance: { type: Number, default: 0 },
  passenger1SharedSaving: { type: Number, default: 0 },
  trafficSurchargePassenger1: { type: Number, default: 0 },
  trafficSurchargePassenger2: { type: Number, default: 0 },
  waitingSurchargePassenger2: { type: Number, default: 0 },
  finalPassenger1Fare: { type: Number, default: 0 },
  finalPassenger2Fare: { type: Number, default: 0 },

}, { timestamps: true });

bookingSchema.index({ ride: 1, passenger: 1 });
bookingSchema.index({ passenger: 1, status: 1 });
bookingSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);