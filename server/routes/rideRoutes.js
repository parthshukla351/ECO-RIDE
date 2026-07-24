const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { calculateCarbonEmission } = require('../utils/carbonCalculator');
const axios = require('axios');

// Create ride (Driver only)
router.post('/create', protect, authorize('driver'), async (req, res) => {
  try {
    const {
      origin, destination, waypoints, departureTime,
      totalSeats, pricePerSeat, vehicleType, preferences,
      distance, duration, rideType
    } = req.body;

    // Calculate carbon data
    const driver = await User.findById(req.user.id);
    const carbonData = calculateCarbonEmission(distance, vehicleType, 1);

    // Get AI suggested price
    let aiSuggestedPrice = pricePerSeat;
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict/pricing`, {
        distance, duration, vehicleType, 
        departureTime, totalSeats
      });
      aiSuggestedPrice = aiResponse.data.suggestedPrice;
    } catch (aiError) {
      console.log('AI pricing service unavailable, using driver price');
    }

    const ride = await Ride.create({
      driver: req.user.id,
      origin, destination, waypoints, departureTime,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat, aiSuggestedPrice,
      vehicleType: vehicleType || driver.vehicleDetails?.vehicleType || 'petrol',
      preferences, distance, duration,
      rideType: rideType || 'regular',
      carbonEmission: carbonData.totalEmission,
      carbonSaved: carbonData.carbonSaved
    });

    res.status(201).json({
      success: true,
      message: '🚗 Ride published successfully!',
      ride,
      carbonData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search rides
router.get('/search', async (req, res) => {
  try {
    const {
      origin, destination, date, seats = 1,
      vehicleType, maxPrice, womenOnly, rideType,
      sortBy = 'departureTime'
    } = req.query;

    const query = {
      status: 'scheduled',
      availableSeats: { $gte: parseInt(seats) },
      departureTime: {
        $gte: date ? new Date(date) : new Date(),
        $lte: date ? new Date(new Date(date).setHours(23, 59, 59)) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    };

    if (origin) query['origin.city'] = { $regex: origin, $options: 'i' };
    if (destination) query['destination.city'] = { $regex: destination, $options: 'i' };
    if (vehicleType) query.vehicleType = vehicleType;
    if (maxPrice) query.pricePerSeat = { $lte: parseFloat(maxPrice) };
    if (womenOnly === 'true') query['preferences.womenOnly'] = true;
    if (rideType) query.rideType = rideType;

    const sortOptions = {
      departureTime: { departureTime: 1 },
      price_low: { pricePerSeat: 1 },
      price_high: { pricePerSeat: -1 },
      rating: { averageRating: -1 },
      eco: { carbonSaved: -1 }
    };

    const rides = await Ride.find(query)
      .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore')
      .sort(sortOptions[sortBy] || { departureTime: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: rides.length,
      rides
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single ride
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore phone')
      .populate({
        path: 'bookings',
        populate: { path: 'passenger', select: 'name avatar averageRating' }
      });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    
    res.status(200).json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my rides (Driver)
router.get('/driver/my-rides', protect, authorize('driver'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { driver: req.user.id };
    if (status) query.status = status;

    const rides = await Ride.find(query)
      .populate('bookings')
      .sort({ departureTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ride.countDocuments(query);

    res.status(200).json({ success: true, rides, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update ride
router.put('/:id', protect, authorize('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (ride.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Cannot edit this ride' });
    }

    const allowedUpdates = ['departureTime', 'pricePerSeat', 'preferences', 'waypoints'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedRide = await Ride.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.status(200).json({ success: true, message: 'Ride updated', ride: updatedRide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel ride
router.put('/:id/cancel', protect, authorize('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('bookings');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancellationReason = req.body.reason || 'Driver cancelled';
    await ride.save();

    // Cancel all bookings and notify passengers
    const Booking = require('../models/Booking');
    const Notification = require('../models/Notification');
    const { emitToUser } = require('../sockets/socketManager');

    for (const booking of ride.bookings) {
      if (['pending', 'confirmed'].includes(booking.status)) {
        await Booking.findByIdAndUpdate(booking._id, {
          status: 'cancelled',
          cancelledBy: 'driver',
          cancelledAt: new Date()
        });

        await Notification.create({
          user: booking.passenger,
          title: '🚫 Ride Cancelled',
          message: `Your ride from ${ride.origin.city} to ${ride.destination.city} has been cancelled by the driver.`,
          type: 'ride_cancelled',
          data: { rideId: ride._id }
        });

        emitToUser(booking.passenger.toString(), 'rideCancelled', { rideId: ride._id });
      }
    }

    res.status(200).json({ success: true, message: 'Ride cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start ride
router.put('/:id/start', protect, authorize('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ride.status = 'in_progress';
    ride.startedAt = new Date();
    ride.trackingStarted = true;
    await ride.save();

    const { emitToRide } = require('../sockets/socketManager');
    emitToRide(ride._id.toString(), 'rideStarted', { rideId: ride._id, startedAt: ride.startedAt });

    res.status(200).json({ success: true, message: '🚗 Ride started!', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// End ride
router.put('/:id/end', protect, authorize('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('bookings');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    // Update driver stats
    const carbonData = calculateCarbonEmission(ride.distance, ride.vehicleType, ride.totalSeats - ride.availableSeats);
    
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        totalRides: 1,
        completedRides: 1,
        totalCO2Saved: carbonData.carbonSaved,
        totalDistanceTravelled: ride.distance,
        ecoPoints: carbonData.ecoPoints
      }
    });

    // Complete all confirmed bookings
    const Booking = require('../models/Booking');
    const Notification = require('../models/Notification');
    const { emitToUser, emitToRide } = require('../sockets/socketManager');

    for (const booking of ride.bookings) {
      if (booking.status === 'confirmed') {
        await Booking.findByIdAndUpdate(booking._id, {
          status: 'completed',
          completedAt: new Date()
        });

        // Update passenger stats
        await User.findByIdAndUpdate(booking.passenger, {
          $inc: {
            totalRides: 1,
            completedRides: 1,
            totalCO2Saved: booking.carbonSaved || 0,
            ecoPoints: booking.ecoPointsEarned || 0
          }
        });

        await Notification.create({
          user: booking.passenger,
          title: '✅ Ride Completed!',
          message: `You saved ${booking.carbonSaved?.toFixed(2)} kg of CO₂! Please rate your driver.`,
          type: 'ride_completed',
          data: { rideId: ride._id, bookingId: booking._id }
        });

        emitToUser(booking.passenger.toString(), 'rideCompleted', { 
          rideId: ride._id, 
          bookingId: booking._id 
        });
      }
    }

    emitToRide(ride._id.toString(), 'rideEnded', { rideId: ride._id });

    res.status(200).json({ 
      success: true, 
      message: '✅ Ride completed successfully!',
      ride,
      carbonData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update live location
router.post('/:id/location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    await Ride.findByIdAndUpdate(req.params.id, {
      currentLocation: { lat, lng, updatedAt: new Date() }
    });

    const { emitToRide } = require('../sockets/socketManager');
    emitToRide(req.params.id, 'locationUpdate', { lat, lng, timestamp: new Date() });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
