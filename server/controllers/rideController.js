const Ride = require('../models/Ride');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { calculateCarbonEmission } = require('../utils/carbonCalculator');
const { emitToUser, emitToRide } = require('../sockets/socketManager');
const axios = require('axios');

const calculateDetailedFare = (pricePerSeat, seatsBooked = 1, distance = 0, vehicleType = 'petrol') => {
  const subtotal = pricePerSeat * seatsBooked;
  const baseFare = Math.max(30, Math.round(subtotal * 0.1));
  const distanceCharge = Math.round(subtotal * 0.7);
  const timeCharge = Math.round(subtotal * 0.2);
  const platformFee = 15;
  
  let discount = 0;
  if (vehicleType === 'electric' || vehicleType === 'hybrid') {
    discount = Math.round(subtotal * 0.1);
  }
  
  const taxableAmount = subtotal + platformFee - discount;
  const taxes = Math.round(taxableAmount * 0.05);
  
  const totalAmount = subtotal + platformFee + taxes - discount;
  const driverEarning = subtotal;
  
  return {
    subtotal,
    baseFare,
    distanceCharge,
    timeCharge,
    platformFee,
    taxes,
    discount,
    totalAmount,
    driverEarning
  };
};

// Ride Intelligence Imports
const { calculateMatchScore } = require('../services/rideMatchingService');
const { parseIntent } = require('../services/nlpParser');

// @desc    Create ride (Driver only)
// @route   POST /api/rides/create
// @access  Private (Driver)
exports.createRide = async (req, res) => {
  try {
    const {
      origin, destination, waypoints, departureTime,
      totalSeats, pricePerSeat, vehicleType, preferences,
      distance: initialDistance, duration: initialDuration, rideType, routePolyline: initialRoutePolyline
    } = req.body;

    const driver = await User.findById(req.user.id);
    const { geocodeAddress, getRouteDetails, extractIntermediatePlaces } = require('../services/rideMatchingService');

    // Dynamic backend geocoding validation to replace default placeholders
    const defaultCoords = [28.6139, 77.209, 19.076, 72.8777];
    const isOriginDefault = !origin.coordinates?.lat || defaultCoords.includes(parseFloat(origin.coordinates.lat));
    const isDestDefault = !destination.coordinates?.lat || defaultCoords.includes(parseFloat(destination.coordinates.lat));

    if (isOriginDefault) {
      const geoOrigin = await geocodeAddress(origin.address || origin.city);
      if (geoOrigin) origin.coordinates = geoOrigin;
    }
    if (isDestDefault) {
      const geoDest = await geocodeAddress(destination.address || destination.city);
      if (geoDest) destination.coordinates = geoDest;
    }

    let distance = initialDistance;
    let duration = initialDuration;
    let routePolyline = initialRoutePolyline;
    let routeCoords = [];

    if (origin.coordinates?.lat && destination.coordinates?.lat) {
      try {
        const routeData = await getRouteDetails(origin.coordinates, destination.coordinates);
        distance = routeData.distance;
        duration = routeData.duration;
        routePolyline = routeData.polyline;
        routeCoords = routeData.coordinates;
      } catch (err) {
        console.warn('Backend route details calculation failed:', err.message);
      }
    }

    const carbonData = calculateCarbonEmission(distance, vehicleType, 1);

    const interPlaces = routeCoords.length > 0 
      ? await extractIntermediatePlaces(origin.city, destination.city, routeCoords)
      : [];

    // Get AI suggested price
    let aiSuggestedPrice = pricePerSeat;
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/predict/pricing`, {
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
      carbonSaved: carbonData.carbonSaved,
      routePolyline,
      routeCoordinates: routeCoords,
      intermediatePlaces: interPlaces
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
};

// @desc    Search rides
// @route   GET /api/rides/search
// @access  Public
exports.searchRides = async (req, res) => {
  try {
    const {
      origin, destination, date, seats = 1,
      vehicleType, maxPrice, womenOnly, rideType,
      originLat, originLng, destinationLat, destinationLng,
      sortBy = 'departureTime'
    } = req.query;

    const query = {
      status: { $in: ['scheduled', 'active'] },
      availableSeats: { $gte: parseInt(seats) }
    };

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      query.departureTime = { $gte: new Date() };
    }

    if (vehicleType) query.vehicleType = vehicleType;
    if (maxPrice) query.pricePerSeat = { $lte: parseFloat(maxPrice) };
    if (womenOnly === 'true') query['preferences.womenOnly'] = true;
    if (rideType) query.rideType = rideType;

    const { geocodeAddress, getClosestPointOnRoute, decodePolyline, calculateMatchScore } = require('../services/rideMatchingService');

    let pLat = parseFloat(originLat);
    let pLng = parseFloat(originLng);
    let dLat = parseFloat(destinationLat);
    let dLng = parseFloat(destinationLng);

    // Geocode queries if lat/lng are missing
    if (origin && (!pLat || !pLng)) {
      const coords = await geocodeAddress(origin);
      if (coords) {
        pLat = coords.lat;
        pLng = coords.lng;
      }
    }
    if (destination && (!dLat || !dLng)) {
      const coords = await geocodeAddress(destination);
      if (coords) {
        dLat = coords.lat;
        dLng = coords.lng;
      }
    }

    // Fallback database string match if coordinates could not be geocoded
    if (!pLat || !pLng || !dLat || !dLng) {
      if (origin) query['origin.city'] = { $regex: origin, $options: 'i' };
      if (destination) query['destination.city'] = { $regex: destination, $options: 'i' };
    }

    const sortOptions = {
      departureTime: { departureTime: 1 },
      price_low: { pricePerSeat: 1 },
      price_high: { pricePerSeat: -1 },
      rating: { 'driver.averageRating': -1 },
      eco: { carbonSaved: -1 }
    };

    let rides = await Ride.find(query)
      .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore')
      .sort(sortOptions[sortBy] || { departureTime: 1 });

    const searchContext = {
      originLat: pLat || originLat,
      originLng: pLng || originLng,
      destinationLat: dLat || destinationLat,
      destinationLng: dLng || destinationLng,
      origin, destination, date
    };

    let matchedRides = [];

    for (let ride of rides) {
      const rideObj = ride.toObject();

      if (pLat && pLng && dLat && dLng) {
        let routeCoords = ride.routeCoordinates || [];
        
        // Lazy-decode polyline if missing in cache database
        if (routeCoords.length === 0 && ride.routePolyline) {
          routeCoords = decodePolyline(ride.routePolyline);
          ride.routeCoordinates = routeCoords;
          await Ride.updateOne({ _id: ride._id }, { $set: { routeCoordinates: routeCoords } });
        }

        if (routeCoords.length > 0) {
          const pickupProj = getClosestPointOnRoute({ lat: pLat, lng: pLng }, routeCoords);
          const dropoffProj = getClosestPointOnRoute({ lat: dLat, lng: dLng }, routeCoords);

          const maxDistance = 8.0; // 8km proximity boundary
          const isPickupNear = pickupProj.distance <= maxDistance;
          const isDropoffNear = dropoffProj.distance <= maxDistance;
          const isDirectionValid = pickupProj.index < dropoffProj.index;

          if (isPickupNear && isDropoffNear && isDirectionValid) {
            let matchType = 'ON_ROUTE';
            if (pickupProj.index === 0 && dropoffProj.index === routeCoords.length - 1) {
              matchType = 'EXACT_ROUTE';
            } else if (pickupProj.index > 0 && dropoffProj.index < routeCoords.length - 1) {
              matchType = 'PARTIAL_ROUTE';
            }

            rideObj.matchType = matchType;
            rideObj.pickupDetour = parseFloat(pickupProj.distance.toFixed(1));
            rideObj.dropoffDetour = parseFloat(dropoffProj.distance.toFixed(1));
            rideObj.totalDetour = parseFloat((pickupProj.distance + dropoffProj.distance).toFixed(1));
            rideObj.routeOverlap = Math.max(10, Math.min(100, Math.round(((dropoffProj.index - pickupProj.index) / routeCoords.length) * 100)));

            // Dynamic Segment Fare Calculation
            const segmentDistance = parseFloat((ride.distance * (rideObj.routeOverlap / 100)).toFixed(1));
            const passengerPricePerSeat = Math.max(30, Math.round(ride.pricePerSeat * (rideObj.routeOverlap / 100)));
            const fareDetails = calculateDetailedFare(passengerPricePerSeat, parseInt(seats), segmentDistance, ride.vehicleType);

            rideObj.segmentDistance = segmentDistance;
            rideObj.passengerPricePerSeat = passengerPricePerSeat;
            rideObj.fareDetails = fareDetails;

            const { score, reasons } = calculateMatchScore(rideObj, searchContext);
            rideObj.matchScore = score;
            rideObj.matchReasons = reasons;

            matchedRides.push(rideObj);
          }
        } else {
          // Fallback matching logic for standard exact match items
          const segmentDistance = ride.distance;
          const passengerPricePerSeat = ride.pricePerSeat;
          const fareDetails = calculateDetailedFare(passengerPricePerSeat, parseInt(seats), segmentDistance, ride.vehicleType);

          rideObj.segmentDistance = segmentDistance;
          rideObj.passengerPricePerSeat = passengerPricePerSeat;
          rideObj.fareDetails = fareDetails;

          const { score, reasons } = calculateMatchScore(rideObj, searchContext);
          rideObj.matchScore = score;
          rideObj.matchReasons = reasons;
          rideObj.matchType = 'EXACT_ROUTE';
          matchedRides.push(rideObj);
        }
      } else {
        const segmentDistance = ride.distance;
        const passengerPricePerSeat = ride.pricePerSeat;
        const fareDetails = calculateDetailedFare(passengerPricePerSeat, parseInt(seats), segmentDistance, ride.vehicleType);

        rideObj.segmentDistance = segmentDistance;
        rideObj.passengerPricePerSeat = passengerPricePerSeat;
        rideObj.fareDetails = fareDetails;

        const { score, reasons } = calculateMatchScore(rideObj, searchContext);
        rideObj.matchScore = score;
        rideObj.matchReasons = reasons;
        rideObj.matchType = 'EXACT_ROUTE';
        matchedRides.push(rideObj);
      }
    }

    if (sortBy === 'best_match') {
      matchedRides.sort((a, b) => b.matchScore - a.matchScore);
    }

    matchedRides = matchedRides.slice(0, 20);

    res.status(200).json({
      success: true,
      count: matchedRides.length,
      rides: matchedRides
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single ride
// @route   GET /api/rides/:id
// @access  Public
exports.getRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore phone')
      .populate({
        path: 'bookings',
        populate: { path: 'passenger', select: 'name avatar averageRating' }
      });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    let rideObj = ride.toObject();
    const { originLat, originLng, destinationLat, destinationLng, seats = 1 } = req.query;

    if (originLat && originLng && destinationLat && destinationLng && ride.routeCoordinates?.length > 0) {
      const { getClosestPointOnRoute } = require('../services/rideMatchingService');
      const pickupProj = getClosestPointOnRoute({ lat: parseFloat(originLat), lng: parseFloat(originLng) }, ride.routeCoordinates);
      const dropoffProj = getClosestPointOnRoute({ lat: parseFloat(destinationLat), lng: parseFloat(destinationLng) }, ride.routeCoordinates);

      if (pickupProj.index < dropoffProj.index) {
        const overlap = Math.max(10, Math.min(100, Math.round(((dropoffProj.index - pickupProj.index) / ride.routeCoordinates.length) * 100)));
        const segmentDistance = parseFloat((ride.distance * (overlap / 100)).toFixed(1));
        const passengerPricePerSeat = Math.max(30, Math.round(ride.pricePerSeat * (overlap / 100)));
        const fareDetails = calculateDetailedFare(passengerPricePerSeat, parseInt(seats), segmentDistance, ride.vehicleType);

        rideObj.segmentDistance = segmentDistance;
        rideObj.passengerPricePerSeat = passengerPricePerSeat;
        rideObj.routeOverlap = overlap;
        rideObj.segmentFareDetails = fareDetails;
      } else {
        const fareDetails = calculateDetailedFare(ride.pricePerSeat, parseInt(seats), ride.distance, ride.vehicleType);
        rideObj.segmentDistance = ride.distance;
        rideObj.passengerPricePerSeat = ride.pricePerSeat;
        rideObj.routeOverlap = 100;
        rideObj.segmentFareDetails = fareDetails;
      }
    } else {
      const fareDetails = calculateDetailedFare(ride.pricePerSeat, parseInt(seats), ride.distance, ride.vehicleType);
      rideObj.segmentDistance = ride.distance;
      rideObj.passengerPricePerSeat = ride.pricePerSeat;
      rideObj.routeOverlap = 100;
      rideObj.segmentFareDetails = fareDetails;
    }
    
    res.status(200).json({ success: true, ride: rideObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my rides (Driver)
// @route   GET /api/rides/driver/my-rides
// @access  Private (Driver)
exports.getMyRides = async (req, res) => {
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
};

// @desc    Update ride (Driver only)
// @route   PUT /api/rides/:id
// @access  Private (Driver)
exports.updateRide = async (req, res) => {
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
};

// @desc    Cancel ride (Driver only)
// @route   PUT /api/rides/:id/cancel
// @access  Private (Driver)
exports.cancelRide = async (req, res) => {
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
};

// @desc    Start ride (Driver only)
// @route   PUT /api/rides/:id/start
// @access  Private (Driver)
exports.startRide = async (req, res) => {
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

    emitToRide(ride._id.toString(), 'rideStarted', { rideId: ride._id, startedAt: ride.startedAt });

    res.status(200).json({ success: true, message: '🚗 Ride started!', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End ride (Driver only)
// @route   PUT /api/rides/:id/end
// @access  Private (Driver)
exports.endRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('bookings');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

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

    for (const booking of ride.bookings) {
      if (booking.status === 'confirmed') {
        await Booking.findByIdAndUpdate(booking._id, {
          status: 'completed',
          completedAt: new Date()
        });

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
};

// @desc    Update live location
// @route   POST /api/rides/:id/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    await Ride.findByIdAndUpdate(req.params.id, {
      currentLocation: { lat, lng, updatedAt: new Date() }
    });

    emitToRide(req.params.id, 'locationUpdate', { lat, lng, timestamp: new Date() });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Smart search using natural language parsing
// @route   POST /api/rides/smart-search
// @access  Public
exports.smartSearchRides = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Parse query intent (AI/regex)
    const params = await parseIntent(query);
    console.log('Parsed Smart Search Params:', params);

    // Build DB search query
    const dbQuery = {
      status: 'scheduled',
      availableSeats: { $gte: 1 }
    };

    if (params.date) {
      const searchDate = new Date(params.date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      dbQuery.departureTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      dbQuery.departureTime = { $gte: new Date() };
    }

    if (params.origin) dbQuery['origin.city'] = { $regex: params.origin, $options: 'i' };
    if (params.destination) dbQuery['destination.city'] = { $regex: params.destination, $options: 'i' };
    if (params.vehicleType) dbQuery.vehicleType = params.vehicleType;
    if (params.womenOnly) dbQuery['preferences.womenOnly'] = true;

    // Fetch rides
    let rides = await Ride.find(dbQuery)
      .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore');

    // Score rides
    const searchContext = {
      origin: params.origin,
      destination: params.destination,
      date: params.date,
      timeOfDay: params.timeOfDay,
      hour: params.hour
    };

    rides = rides.map(ride => {
      const { score, reasons } = calculateMatchScore(ride, searchContext);
      const rideObj = ride.toObject();
      rideObj.matchScore = score;
      rideObj.matchReasons = reasons;
      return rideObj;
    });

    // Default sorting for smart search is best_match, or if parsed sorting is low price
    if (params.sortBy === 'price_low') {
      rides.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    } else {
      rides.sort((a, b) => b.matchScore - a.matchScore);
    }

    res.status(200).json({
      success: true,
      count: rides.length,
      parsedParams: params,
      rides: rides.slice(0, 20)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get personalized recommendations for the passenger
// @route   GET /api/rides/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user's ride history
    const completedBookings = await Booking.find({ passenger: userId, status: 'completed' })
      .populate('ride')
      .sort({ createdAt: -1 });

    let preferredOrigin = '';
    let preferredDest = '';
    let preferredHour = null;

    if (completedBookings.length > 0) {
      // Find most common completed booking route and departure times
      const routesCount = {};
      const hoursCount = {};

      completedBookings.forEach(booking => {
        if (booking.ride) {
          const originCity = booking.ride.origin?.city;
          const destCity = booking.ride.destination?.city;
          if (originCity && destCity) {
            const key = `${originCity}|${destCity}`;
            routesCount[key] = (routesCount[key] || 0) + 1;
          }

          if (booking.ride.departureTime) {
            const depHour = new Date(booking.ride.departureTime).getHours();
            hoursCount[depHour] = (hoursCount[depHour] || 0) + 1;
          }
        }
      });

      // Find top route
      let topRouteKey = '';
      let maxRouteVal = 0;
      Object.entries(routesCount).forEach(([key, val]) => {
        if (val > maxRouteVal) {
          maxRouteVal = val;
          topRouteKey = key;
        }
      });

      if (topRouteKey) {
        const parts = topRouteKey.split('|');
        preferredOrigin = parts[0];
        preferredDest = parts[1];
      }

      // Find top hour
      let topHour = null;
      let maxHourVal = 0;
      Object.entries(hoursCount).forEach(([key, val]) => {
        if (val > maxHourVal) {
          maxHourVal = val;
          topHour = parseInt(key);
        }
      });
      preferredHour = topHour;
    }

    // 2. Query upcoming scheduled rides
    const query = {
      status: 'scheduled',
      availableSeats: { $gte: 1 },
      departureTime: { $gte: new Date() }
    };

    // If passenger is returning, fetch rides starting from preferred origin
    if (preferredOrigin) {
      query['origin.city'] = { $regex: preferredOrigin, $options: 'i' };
    }

    let rides = await Ride.find(query)
      .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore')
      .limit(30);

    // If returning user has no matching rides for preferred route, relax query to general scheduled rides
    if (rides.length === 0) {
      delete query['origin.city'];
      rides = await Ride.find(query)
        .populate('driver', 'name avatar averageRating totalRides vehicleDetails ecoLevel safetyScore')
        .limit(30);
    }

    // 3. Score candidates
    const searchContext = {
      origin: preferredOrigin,
      destination: preferredDest,
      hour: preferredHour
    };

    let scoredRides = rides.map(ride => {
      const { score, reasons } = calculateMatchScore(ride, searchContext);
      const rideObj = ride.toObject();
      rideObj.matchScore = score;
      
      // Inject personalized reason based on history
      const personalizedReasons = [...reasons];
      if (preferredOrigin && ride.origin?.city?.toLowerCase() === preferredOrigin.toLowerCase() && !personalizedReasons.includes('Exact pickup city match')) {
        personalizedReasons.unshift('Matches your favorite starting city');
      }
      if (preferredHour !== null && ride.departureTime) {
        const depHour = new Date(ride.departureTime).getHours();
        if (Math.abs(depHour - preferredHour) <= 2) {
          personalizedReasons.unshift('Matches your usual departure hours');
        }
      }

      rideObj.matchReasons = personalizedReasons.slice(0, 3);
      return rideObj;
    });

    // 4. Sort and return top 4 recommendations
    scoredRides.sort((a, b) => b.matchScore - a.matchScore);
    const recommendations = scoredRides.slice(0, 4);

    // 5. Fallback explanation label if first time user (no history)
    const isNewUser = completedBookings.length === 0;
    
    res.status(200).json({
      success: true,
      isNewUser,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
