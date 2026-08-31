const OnDemandRideRequest = require('../models/OnDemandRideRequest');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { emitToUser, getIO } = require('../sockets/socketManager');

// Haversine formula to compute distance in km
const getGeographicDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate detailed fare breakdown for on-demand rides
const calculateOnDemandFare = (distance, vehicleType = 'electric') => {
  const baseRatePerKm = 12;
  const baseFare = Math.round(distance * baseRatePerKm);
  const platformFee = 15;
  
  let discount = 0;
  if (vehicleType === 'electric' || vehicleType === 'hybrid') {
    discount = Math.round(baseFare * 0.1);
  }
  
  const gstRate = 0.05; // 5% GST
  const taxableAmount = baseFare + platformFee - discount;
  const gst = Math.round(taxableAmount * gstRate);
  
  const estimatedTotal = baseFare + platformFee + gst - discount;
  
  return {
    baseRatePerKm,
    baseFare,
    platformFee,
    discount,
    gst,
    estimatedTotal
  };
};

// @desc    Create On-Demand Ride Request
// @route   POST /api/ondemand/request
// @access  Private (Rider)
exports.createRequest = async (req, res) => {
  try {
    const { origin, destination, distance, duration, routePolyline, routeCoordinates } = req.body;
    
    if (!origin || !destination || !distance || !duration) {
      return res.status(400).json({ success: false, message: 'Missing required request parameters' });
    }

    // Get rider details
    const rider = await User.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    // Calculate fare
    const fare = calculateOnDemandFare(distance, rider.vehicleDetails?.vehicleType || 'electric');

    // Create the request
    const request = await OnDemandRideRequest.create({
      rider: req.user.id,
      origin,
      destination,
      distance,
      duration,
      routePolyline,
      routeCoordinates,
      baseRatePerKm: fare.baseRatePerKm,
      baseFare: fare.baseFare,
      gst: fare.gst,
      additionalCharges: fare.platformFee,
      estimatedTotal: fare.estimatedTotal,
      status: 'pending'
    });

    // Find eligible drivers within 10 km
    const drivers = await User.find({
      role: 'driver',
      isAvailable: true,
      isActive: true,
      isBanned: false,
      'currentLocation.lat': { $exists: true }
    });

    const nearbyDrivers = [];
    const pickupLat = origin.coordinates.lat;
    const pickupLng = origin.coordinates.lng;

    for (const driver of drivers) {
      const driverLat = driver.currentLocation.lat;
      const driverLng = driver.currentLocation.lng;
      
      const geoDist = getGeographicDistance(pickupLat, pickupLng, driverLat, driverLng);
      if (geoDist <= 10) { // 10 km radius limit
        nearbyDrivers.push({ driver, distanceToRider: geoDist });
      }
    }

    if (nearbyDrivers.length === 0) {
      request.status = 'expired';
      await request.save();
      return res.status(200).json({
        success: true,
        message: 'No available drivers found within 10 km',
        request,
        driversFound: 0
      });
    }

    // Broadcast request to nearby drivers
    nearbyDrivers.forEach(({ driver, distanceToRider }) => {
      // 1. Socket notification
      emitToUser(driver._id.toString(), 'onDemandRequestCreated', {
        requestId: request._id,
        origin: request.origin,
        destination: request.destination,
        distance: request.distance,
        estimatedTotal: request.estimatedTotal,
        distanceToRider: parseFloat(distanceToRider.toFixed(1)),
        riderName: rider.name
      });

      // 2. Web push notification simulation / log
      if (driver.pushToken) {
        console.log(`[PUSH NOTIFICATION] Sent to driver ${driver.name} (Token: ${driver.pushToken}) -> 🚗 New Ride Request: Pickup at ${origin.address}`);
      }
    });

    res.status(201).json({
      success: true,
      message: `Searching for drivers... request broadcasted to ${nearbyDrivers.length} drivers nearby`,
      request,
      driversFound: nearbyDrivers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept On-Demand Request (Driver)
// @route   POST /api/ondemand/accept
// @access  Private (Driver)
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const driverId = req.user.id;

    // Fetch driver details
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(403).json({ success: false, message: 'Only registered drivers can accept requests' });
    }

    // Atomic request fetch & update
    const request = await OnDemandRideRequest.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      { status: 'accepted', assignedDriver: driverId },
      { new: true }
    ).populate('rider');

    if (!request) {
      return res.status(400).json({
        success: false,
        message: 'This request has already been accepted by another driver, cancelled, or expired.'
      });
    }

    // 1. Create Ride document
    const totalSeats = driver.vehicleDetails?.seatingCapacity || 4;
    const ride = await Ride.create({
      driver: driverId,
      origin: request.origin,
      destination: request.destination,
      departureTime: new Date(),
      duration: request.duration,
      distance: request.distance,
      routePolyline: request.routePolyline,
      routeCoordinates: request.routeCoordinates,
      totalSeats,
      availableSeats: totalSeats - 1, // Passenger takes 1 seat
      pricePerSeat: request.baseFare,
      vehicleType: driver.vehicleDetails?.vehicleType || 'electric',
      status: 'active',
      rideType: 'on_demand',
      currentLocation: driver.currentLocation
    });

    // 2. Create Booking document for the rider
    const booking = await Booking.create({
      ride: ride._id,
      passenger: request.rider._id,
      driver: driverId,
      seatsBooked: 1,
      seats: [1], // First seat is occupied by default
      pricePerSeat: request.baseFare,
      totalAmount: request.estimatedTotal,
      pickupLocation: request.origin,
      dropLocation: request.destination,
      status: 'confirmed',
      paymentStatus: 'pending'
    });

    // Update ride with booking reference
    ride.bookings.push(booking._id);
    await ride.save();

    // Link Ride ID back to request
    request.rideId = ride._id;
    await request.save();

    // Notify Rider via socket
    emitToUser(request.rider._id.toString(), 'onDemandRequestAccepted', {
      requestId: request._id,
      rideId: ride._id,
      driver: {
        name: driver.name,
        avatar: driver.avatar,
        averageRating: driver.averageRating,
        totalRides: driver.totalRides,
        isDriverVerified: driver.isDriverVerified,
        phone: driver.phone,
        vehicleDetails: driver.vehicleDetails
      },
      booking
    });

    // Notify other drivers to close notification modals
    const io = getIO?.();
    if (io) {
      io.emit('onDemandRequestClosed', { requestId: request._id });
    }

    res.status(200).json({
      success: true,
      message: '🚗 Ride request accepted! Ride and booking created.',
      ride,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Decline On-Demand Request (Driver)
// @route   POST /api/ondemand/decline
// @access  Private (Driver)
exports.declineRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await OnDemandRideRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!request.declinedDrivers.includes(req.user.id)) {
      request.declinedDrivers.push(req.user.id);
      await request.save();
    }

    res.status(200).json({ success: true, message: 'Request declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel On-Demand Request (Rider)
// @route   POST /api/ondemand/cancel
// @access  Private (Rider)
exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await OnDemandRideRequest.findOneAndUpdate(
      { _id: requestId, rider: req.user.id, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({ success: false, message: 'Unable to cancel request. It might have been accepted already.' });
    }

    // Close notifications for all drivers
    const io = getIO?.();
    if (io) {
      io.emit('onDemandRequestClosed', { requestId: request._id });
    }

    res.status(200).json({ success: true, message: 'Request cancelled successfully', request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Driver Location
// @route   POST /api/ondemand/location
// @access  Private (Driver)
exports.updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude, isAvailable } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude coordinates are required' });
    }

    const updates = {
      currentLocation: {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        updatedAt: new Date()
      }
    };

    if (isAvailable !== undefined) {
      updates.isAvailable = isAvailable;
    }

    const driver = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    
    res.status(200).json({
      success: true,
      message: 'Live location updated successfully',
      currentLocation: driver.currentLocation,
      isAvailable: driver.isAvailable
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper method to fetch eligible nearby drivers (for debugging or radar screens)
exports.getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Coordinates are required' });
    }

    const drivers = await User.find({
      role: 'driver',
      isAvailable: true,
      isActive: true,
      isBanned: false,
      'currentLocation.lat': { $exists: true }
    });

    const nearby = [];
    for (const d of drivers) {
      const dist = getGeographicDistance(parseFloat(lat), parseFloat(lng), d.currentLocation.lat, d.currentLocation.lng);
      if (dist <= 10) {
        nearby.push({
          name: d.name,
          lat: d.currentLocation.lat,
          lng: d.currentLocation.lng,
          distance: dist
        });
      }
    }

    res.status(200).json({ success: true, count: nearby.length, drivers: nearby });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
