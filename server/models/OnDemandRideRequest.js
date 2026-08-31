const mongoose = require('mongoose');

const onDemandRideRequestSchema = new mongoose.Schema({
  rider: {
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
  distance: Number,
  duration: Number,
  routePolyline: String,
  routeCoordinates: [{
    lat: Number,
    lng: Number
  }],
  baseRatePerKm: { type: Number, default: 12 },
  baseFare: Number,
  gst: Number,
  additionalCharges: { type: Number, default: 15 }, // Platform fee
  estimatedTotal: Number,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
    default: 'pending'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  declinedDrivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  }
}, { timestamps: true });

module.exports = mongoose.model('OnDemandRideRequest', onDemandRideRequestSchema);
