const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  destination: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  waypoints: [{
    address: String,
    coordinates: { lat: Number, lng: Number }
  }],
  departureTime: { type: Date, required: true },
  estimatedArrival: Date,
  duration: Number, // minutes
  distance: Number, // km
  routePolyline: String,
  routeCoordinates: [{
    lat: Number,
    lng: Number
  }],
  intermediatePlaces: [{
    name: String,
    lat: Number,
    lng: Number,
    progress: Number
  }],

  totalSeats: { type: Number, required: true, min: 1, max: 6 },
  availableSeats: { type: Number, required: true },

  pricePerSeat: { type: Number, required: true },
  aiSuggestedPrice: Number,

  vehicleType: {
    type: String,
    enum: ['petrol', 'diesel', 'hybrid', 'electric'],
    required: true
  },

  status: {
    type: String,
    enum: ['scheduled', 'active', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },

  preferences: {
    womenOnly: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    musicAllowed: { type: Boolean, default: true },
    acAvailable: { type: Boolean, default: true },
    luggageAllowed: { type: Boolean, default: true }
  },

  rideType: {
    type: String,
    enum: ['regular', 'women_only', 'student', 'office'],
    default: 'regular'
  },

  // Carbon data
  carbonEmission: Number,
  carbonSaved: Number,
  ecoScore: { type: Number, default: 0 },

  // Live tracking
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  trackingStarted: { type: Boolean, default: false },

  // AI data
  demandScore: Number,
  rideSuccessProbability: Number,
  isAIMatched: { type: Boolean, default: false },

  // Stats
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],

  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,

  trafficDelaySeconds: { type: Number, default: 0 },
  trafficCharge: { type: Number, default: 0 }

}, { timestamps: true });

// Indexes
rideSchema.index({ 'origin.city': 1, 'destination.city': 1 });
rideSchema.index({ departureTime: 1, status: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ status: 1, availableSeats: 1 });

module.exports = mongoose.model('Ride', rideSchema);