const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateCarbonEmission } = require('../utils/carbonCalculator');
const { emitToUser } = require('../sockets/socketManager');
const WalletTransaction = require('../models/WalletTransaction');

const adjustWalletBalance = async (userId, type, amount, description = '', referenceId = '') => {
  const user = await User.findById(userId);
  if (!user) return;
  
  const balanceBefore = user.walletBalance || 0;
  user.walletBalance = balanceBefore + amount;
  await user.save();
  
  await WalletTransaction.create({
    user: userId,
    type,
    amount,
    balanceBefore,
    balanceAfter: user.walletBalance,
    description,
    referenceId,
    status: 'success'
  });
};

const calculateOverlapSavings = (ride, u1Booking, u2Pickup, u2Drop) => {
  const { getClosestPointOnRoute } = require('../services/rideMatchingService');
  
  if (!ride.routeCoordinates || ride.routeCoordinates.length === 0) {
    return 0;
  }
  
  // Find indices for Passenger 1
  const p1Pickup = u1Booking.pickupLocation.coordinates;
  const p1Drop = u1Booking.dropLocation.coordinates;
  const p1PickupProj = getClosestPointOnRoute(p1Pickup, ride.routeCoordinates);
  const p1DropProj = getClosestPointOnRoute(p1Drop, ride.routeCoordinates);
  
  // Find indices for Passenger 2
  const p2PickupProj = getClosestPointOnRoute(u2Pickup, ride.routeCoordinates);
  const p2DropProj = getClosestPointOnRoute(u2Drop, ride.routeCoordinates);
  
  const p1Start = Math.min(p1PickupProj.index, p1DropProj.index);
  const p1End = Math.max(p1PickupProj.index, p1DropProj.index);
  const p2Start = Math.min(p2PickupProj.index, p2DropProj.index);
  const p2End = Math.max(p2PickupProj.index, p2DropProj.index);
  
  // Intersection range
  const overlapStart = Math.max(p1Start, p2Start);
  const overlapEnd = Math.min(p1End, p2End);
  
  if (overlapStart < overlapEnd) {
    const totalPoints = ride.routeCoordinates.length;
    const overlapPercentage = (overlapEnd - overlapStart) / totalPoints;
    const sharedDistance = ride.distance * overlapPercentage;
    const savings = Math.round(sharedDistance * 12 * 0.5);
    return Math.max(0, savings);
  }
  return 0;
};

const confirmSharedBooking = async (booking) => {
  booking.status = 'confirmed';
  booking.confirmedAt = new Date();
  await booking.save();

  // Find Passenger 1's booking
  const u1Booking = await Booking.findOne({
    ride: booking.ride,
    status: 'confirmed',
    _id: { $ne: booking._id }
  }).populate('passenger');

  if (u1Booking) {
    const adjustment = booking.sharedRideAdjustment || 0;
    u1Booking.sharedRideAdjustment = adjustment;
    u1Booking.totalAmount = Math.max(30, u1Booking.totalAmount - adjustment);
    
    // Update audit fields for Passenger 1
    u1Booking.passenger1SharedSaving = adjustment;
    u1Booking.finalPassenger1Fare = u1Booking.totalAmount;
    await u1Booking.save();

    await adjustWalletBalance(
      u1Booking.passenger._id,
      'REFUND',
      adjustment,
      `Shared ride savings adjustment for booking ${u1Booking._id}`,
      u1Booking._id.toString()
    );

    await Notification.create({
      user: u1Booking.passenger._id,
      title: '💰 Shared Ride Savings Applied!',
      message: `Another passenger joined your ride! You saved ₹${adjustment}. Your updated fare is ₹${u1Booking.totalAmount}.`,
      type: 'fare_updated',
      data: { bookingId: u1Booking._id, rideId: booking.ride }
    });

    emitToUser(u1Booking.passenger._id.toString(), 'fareUpdated', {
      bookingId: u1Booking._id,
      newFare: u1Booking.totalAmount,
      savings: adjustment
    });

    // Notify Passenger 1: Passenger 2 has been added to your ride
    await Notification.create({
      user: u1Booking.passenger._id,
      title: '👥 Passenger added to your ride',
      message: `${booking.passenger.name || 'A passenger'} has been added to your ride.`,
      type: 'shared_passenger_added',
      data: { bookingId: booking._id, rideId: booking.ride }
    });
    
    emitToUser(u1Booking.passenger._id.toString(), 'sharedPassengerAdded', {
      bookingId: u1Booking._id,
      newPassenger: {
        name: booking.passenger.name,
        avatar: booking.passenger.avatar
      },
      newFare: u1Booking.totalAmount,
      savings: adjustment,
      message: `${booking.passenger.name} has been added to your ride.`
    });
  }

  // Notify Passenger 2 (booking.passenger)
  await Notification.create({
    user: booking.passenger._id || booking.passenger,
    title: '✅ Shared Ride Confirmed!',
    message: `Your shared-ride request from ${booking.pickupLocation.address} to ${booking.dropLocation.address} is confirmed.`,
    type: 'booking_confirmed',
    data: { bookingId: booking._id, rideId: booking.ride }
  });

  emitToUser((booking.passenger._id || booking.passenger).toString(), 'bookingConfirmed', {
    bookingId: booking._id,
    message: 'Your ride has been confirmed.'
  });

  // Notify Driver
  await Notification.create({
    user: booking.driver,
    title: '👥 Passenger added to your ride',
    message: `${booking.passenger.name || 'A passenger'} has been added to your ride.`,
    type: 'shared_passenger_added',
    data: { bookingId: booking._id, rideId: booking.ride }
  });

  emitToUser(booking.driver.toString(), 'sharedPassengerAdded', {
    bookingId: booking._id,
    newPassenger: {
      name: booking.passenger.name,
      avatar: booking.passenger.avatar
    },
    message: `${booking.passenger.name} has been added to your ride.`
  });

  // Broadcast updated seat details to ride room
  const io = require('../sockets/socketManager').getIO?.() || null;
  if (io) {
    io.to(booking.ride.toString()).emit('rideDetailsUpdated', {
      rideId: booking.ride,
      seats: [1, ...booking.seats],
      passengerCount: 2
    });
  }
};


// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (Passenger)
exports.createBooking = async (req, res) => {
  try {
    const { rideId, seatsBooked, seats, pickupLocation, dropLocation } = req.body;

    if (!seats || !Array.isArray(seats) || seats.length !== parseInt(seatsBooked)) {
      return res.status(400).json({
        success: false,
        message: `Please select exactly ${seatsBooked} seat(s) on the seat map`
      });
    }

    // Get ride
    const ride = await Ride.findById(rideId).populate('driver');
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Verify seat indices boundaries
    const maxSeats = ride.totalSeats || 4;
    for (const seatNum of seats) {
      if (seatNum < 1 || seatNum > maxSeats) {
        return res.status(400).json({ success: false, message: `Invalid seat number ${seatNum}` });
      }
    }

    // Check availability
    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({
        success: false,
        message: `Only ${ride.availableSeats} seats available`
      });
    }

    // Check if ride is in the past
    if (new Date(ride.departureTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a ride in the past'
      });
    }

    // Check if user already booked
    const existingBooking = await Booking.findOne({
      ride: rideId,
      passenger: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You have already booked this ride'
      });
    }

    // DB-level race condition check: ensure selected seats are not already occupied
    const duplicateBooking = await Booking.findOne({
      ride: rideId,
      status: { $in: ['pending', 'confirmed'] },
      seats: { $in: seats }
    });
    if (duplicateBooking) {
      return res.status(400).json({
        success: false,
        message: 'One or more of the selected seats are already booked by another passenger'
      });
    }

    // Calculate carbon saved
    const carbonData = calculateCarbonEmission(
      ride.distance,
      ride.vehicleType,
      seatsBooked
    );

    // Calculate segment-based pricing
    let passengerPricePerSeat = ride.pricePerSeat;
    if (pickupLocation?.coordinates?.lat && dropLocation?.coordinates?.lat && ride.routeCoordinates?.length > 0) {
      const { getClosestPointOnRoute } = require('../services/rideMatchingService');
      const pickupProj = getClosestPointOnRoute(pickupLocation.coordinates, ride.routeCoordinates);
      const dropoffProj = getClosestPointOnRoute(dropLocation.coordinates, ride.routeCoordinates);
      
      if (pickupProj.index < dropoffProj.index) {
        const overlap = Math.max(10, Math.min(100, Math.round(((dropoffProj.index - pickupProj.index) / ride.routeCoordinates.length) * 100)));
        passengerPricePerSeat = Math.max(30, Math.round(ride.pricePerSeat * (overlap / 100)));
      }
    }

    const totalAmount = seatsBooked * passengerPricePerSeat;

    // Check if there are existing confirmed bookings on the ride
    const confirmedBookings = await Booking.find({ ride: rideId, status: 'confirmed' }).populate('passenger');
    
    let isSharedRideCandidate = false;
    let passengerApprovalStatus = 'none';
    let driverApprovalStatus = 'none';
    let sharedRideAdjustment = 0;
    let originalFare = totalAmount;
    let finalTotalAmount = totalAmount;

    // Detailed audit fields
    let originalPassenger1Fare = 0;
    let passenger2RouteDistance = ride.distance;
    let passenger2BaseFare = Math.round(ride.distance * 12);
    let sharedDistance = 0;
    let passenger1SharedSaving = 0;
    let finalPassenger1Fare = 0;
    let finalPassenger2Fare = totalAmount;

    if (confirmedBookings.length > 0) {
      isSharedRideCandidate = true;
      passengerApprovalStatus = 'pending';
      driverApprovalStatus = 'pending';
      
      const firstBooking = confirmedBookings[0];
      const p2Pickup = pickupLocation?.coordinates || ride.origin.coordinates;
      const p2Drop = dropLocation?.coordinates || ride.destination.coordinates;
      
      // Calculate Passenger 2 segment distance
      const { getClosestPointOnRoute } = require('../services/rideMatchingService');
      if (ride.routeCoordinates && ride.routeCoordinates.length > 0) {
        const p1Pickup = firstBooking.pickupLocation.coordinates;
        const p1Drop = firstBooking.dropLocation.coordinates;
        const p1PickupProj = getClosestPointOnRoute(p1Pickup, ride.routeCoordinates);
        const p1DropProj = getClosestPointOnRoute(p1Drop, ride.routeCoordinates);
        
        const p2PickupProj = getClosestPointOnRoute(p2Pickup, ride.routeCoordinates);
        const p2DropProj = getClosestPointOnRoute(p2Drop, ride.routeCoordinates);
        
        const p1Start = Math.min(p1PickupProj.index, p1DropProj.index);
        const p1End = Math.max(p1PickupProj.index, p1DropProj.index);
        const p2Start = Math.min(p2PickupProj.index, p2DropProj.index);
        const p2End = Math.max(p2PickupProj.index, p2DropProj.index);
        
        // Passenger 2 distance
        const p2IdxDiff = Math.abs(p2End - p2Start);
        passenger2RouteDistance = parseFloat((ride.distance * (p2IdxDiff / ride.routeCoordinates.length)).toFixed(2)) || 1;
        passenger2BaseFare = Math.round(passenger2RouteDistance * 12);
        
        const platformFee = 15;
        const gst = Math.round((passenger2BaseFare + platformFee) * 0.05);
        originalFare = passenger2BaseFare + platformFee + gst;

        // Shared distance overlap range
        const overlapStart = Math.max(p1Start, p2Start);
        const overlapEnd = Math.min(p1End, p2End);
        if (overlapStart < overlapEnd) {
          sharedDistance = parseFloat((ride.distance * ((overlapEnd - overlapStart) / ride.routeCoordinates.length)).toFixed(2));
          sharedRideAdjustment = Math.round(sharedDistance * 12 * 0.5);
        }
      }

      passenger1SharedSaving = sharedRideAdjustment;
      finalTotalAmount = Math.max(30, originalFare - sharedRideAdjustment);

      originalPassenger1Fare = firstBooking.originalFare || firstBooking.totalAmount;
      finalPassenger1Fare = Math.max(30, originalPassenger1Fare - sharedRideAdjustment);
      finalPassenger2Fare = finalTotalAmount;
    }

    const booking = await Booking.create({
      ride: rideId,
      passenger: req.user.id,
      driver: ride.driver._id,
      seatsBooked,
      seats,
      pricePerSeat: passengerPricePerSeat,
      totalAmount: finalTotalAmount,
      pickupLocation: pickupLocation || ride.origin,
      dropLocation: dropLocation || ride.destination,
      carbonSaved: carbonData.carbonSaved,
      ecoPointsEarned: carbonData.ecoPoints,
      status: 'pending',
      isSharedRideCandidate,
      passengerApprovalStatus,
      driverApprovalStatus,
      sharedRideAdjustment,
      originalFare,
      originalPassenger1Fare,
      passenger2RouteDistance,
      passenger2BaseFare,
      sharedDistance,
      passenger1SharedSaving,
      finalPassenger1Fare,
      finalPassenger2Fare
    });

    // Update ride seats
    ride.availableSeats -= seatsBooked;
    ride.bookings.push(booking._id);
    await ride.save();

    // Release temporary locks for these seats
    const SeatLock = require('../models/SeatLock');
    await SeatLock.deleteMany({
      ride: rideId,
      seatNumber: { $in: seats }
    });

    // Notify other users of seat occupancy updates via socket
    const io = require('../sockets/socketManager').getIO?.() || null;
    if (io) {
      io.to(rideId.toString()).emit('seatsOccupied', { rideId, seats });
    }

    if (isSharedRideCandidate) {
      const firstBooking = confirmedBookings[0];
      await Notification.create({
        user: firstBooking.passenger._id,
        title: '🔄 New Passenger wants to share your ride',
        message: `${req.user.name} wants to join your ride. You will save ₹${sharedRideAdjustment}!`,
        type: 'shared_ride_passenger_approval_required',
        data: { bookingId: booking._id, rideId }
      });
      emitToUser(firstBooking.passenger._id.toString(), 'newShareRequest', {
        bookingId: booking._id,
        passengerName: req.user.name,
        pickup: pickupLocation?.city || ride.origin.city,
        destination: dropLocation?.city || ride.destination.city,
        savings: sharedRideAdjustment
      });
    } else {
      await Notification.create({
        user: ride.driver._id,
        title: '🎉 New Booking Request',
        message: `${req.user.name} requested seat(s) ${seats.join(', ')} for your ride`,
        type: 'booking_confirmed',
        data: { bookingId: booking._id, rideId }
      });

      emitToUser(ride.driver._id.toString(), 'newBooking', {
        bookingId: booking._id,
        passenger: {
          name: req.user.name,
          avatar: req.user.avatar
        },
        seatsBooked,
        seats
      });
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('passenger', 'name avatar phone averageRating')
      .populate('driver', 'name avatar phone')
      .populate('ride');

    res.status(201).json({
      success: true,
      message: '✅ Booking request sent to driver!',
      booking: populatedBooking,
      carbonData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my bookings (Passenger)
// @route   GET /api/bookings/my-bookings
// @access  Private (Passenger)
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { passenger: req.user.id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('driver', 'name avatar phone averageRating vehicleDetails')
      .populate('ride')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking requests for driver
// @route   GET /api/bookings/driver/requests
// @access  Private (Driver)
exports.getDriverBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { driver: req.user.id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('passenger', 'name avatar phone averageRating gender')
      .populate('ride')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger', 'name avatar phone averageRating email')
      .populate('driver', 'name avatar phone averageRating email vehicleDetails')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    if (
      booking.passenger._id.toString() !== req.user.id &&
      booking.driver._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm booking (Driver)
// @route   PUT /api/bookings/:id/confirm
// @access  Private (Driver)
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking already processed'
      });
    }

    if (booking.isSharedRideCandidate) {
      booking.driverApprovalStatus = 'approved';
      
      if (booking.passengerApprovalStatus === 'approved') {
        await confirmSharedBooking(booking);
      } else {
        await booking.save();
        
        // Notify passenger 2 that driver accepted, waiting for Passenger 1
        await Notification.create({
          user: booking.passenger._id,
          title: '⏳ Share Request Accepted by Driver',
          message: `The driver accepted your shared ride. Waiting for Passenger 1's approval.`,
          type: 'booking_pending_approval',
          data: { bookingId: booking._id, rideId: booking.ride._id }
        });
        emitToUser(booking.passenger._id.toString(), 'sharePendingPassenger1', {
          bookingId: booking._id
        });
      }
    } else {
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      await booking.save();

      // Notify passenger
      await Notification.create({
        user: booking.passenger._id,
        title: '✅ Booking Confirmed!',
        message: `Your ride from ${booking.ride.origin.city} to ${booking.ride.destination.city} has been confirmed`,
        type: 'booking_confirmed',
        data: { bookingId: booking._id, rideId: booking.ride._id }
      });

      emitToUser(booking.passenger._id.toString(), 'bookingConfirmed', {
        bookingId: booking._id
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Booking confirmed!',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject booking (Driver)
// @route   PUT /api/bookings/:id/reject
// @access  Private (Driver)
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking already processed'
      });
    }

    booking.status = 'rejected';
    if (booking.isSharedRideCandidate) {
      booking.driverApprovalStatus = 'denied';
      
      const u1Booking = await Booking.findOne({
        ride: booking.ride._id,
        status: 'confirmed',
        _id: { $ne: booking._id }
      }).populate('passenger');

      if (u1Booking) {
        await Notification.create({
          user: u1Booking.passenger._id,
          title: '🔄 Share Request Cancelled',
          message: `The driver declined the request for a passenger to share your ride.`,
          type: 'shared_ride_cancelled',
          data: { bookingId: u1Booking._id, rideId: booking.ride._id }
        });
        emitToUser(u1Booking.passenger._id.toString(), 'sharedRideCancelled', {
          bookingId: u1Booking._id
        });
      }
    }
    await booking.save();

    // Restore ride seats
    const ride = await Ride.findById(booking.ride._id);
    ride.availableSeats += booking.seatsBooked;
    ride.bookings = ride.bookings.filter(b => b.toString() !== booking._id.toString());
    await ride.save();

    const io = require('../sockets/socketManager').getIO?.() || null;
    if (io) {
      io.to(booking.ride._id.toString()).emit('seatsReleased', { rideId: booking.ride._id });
    }

    // Notify passenger
    await Notification.create({
      user: booking.passenger._id,
      title: '❌ Booking Rejected',
      message: `Your booking request was declined by the driver`,
      type: 'booking_rejected',
      data: { bookingId: booking._id, rideId: booking.ride._id }
    });

    emitToUser(booking.passenger._id.toString(), 'bookingRejected', {
      bookingId: booking._id
    });

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger')
      .populate('driver')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isPassenger = booking.passenger._id.toString() === req.user.id;
    const isDriver = booking.driver._id.toString() === req.user.id;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = isPassenger ? 'passenger' : 'driver';
    booking.cancellationReason = req.body.reason || 'No reason provided';
    booking.cancelledAt = new Date();
    await booking.save();

    // Restore seats
    const ride = await Ride.findById(booking.ride._id);
    ride.availableSeats += booking.seatsBooked;
    await ride.save();

    const io = require('../sockets/socketManager').getIO?.() || null;
    if (io) {
      io.to(booking.ride._id.toString()).emit('seatsReleased', { rideId: booking.ride._id });
    }

    // Update user cancellation count
    const cancellingUser = await User.findById(req.user.id);
    cancellingUser.cancellationCount += 1;
    await cancellingUser.save();

    // Notify the other party
    const otherParty = isPassenger ? booking.driver._id : booking.passenger._id;
    await Notification.create({
      user: otherParty,
      title: '❌ Booking Cancelled',
      message: `${req.user.name} cancelled the booking`,
      type: 'booking_cancelled',
      data: { bookingId: booking._id, rideId: booking.ride._id }
    });

    emitToUser(otherParty.toString(), 'bookingCancelled', {
      bookingId: booking._id,
      cancelledBy: req.user.name
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Passenger 1 approves dynamic route sharing
// @route   PUT /api/bookings/:id/passenger-approve
// @access  Private (Passenger)
exports.passengerApproveShare = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Get Passenger 1's booking
    const u1Booking = await Booking.findOne({
      ride: booking.ride._id,
      status: 'confirmed',
      _id: { $ne: booking._id }
    });

    if (!u1Booking || u1Booking.passenger.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.passengerApprovalStatus = 'approved';
    
    if (booking.driverApprovalStatus === 'approved') {
      await confirmSharedBooking(booking);
      res.status(200).json({ success: true, message: 'Share approved and booking confirmed!', booking });
    } else {
      await booking.save();
      
      // Notify Driver that Passenger 1 approved and waiting for Driver's approval
      await Notification.create({
        user: booking.driver,
        title: '🚗 New Shared Ride Request',
        message: `${booking.passenger.name || 'A passenger'} wants to join your ride. Passenger 1 approved. Please confirm!`,
        type: 'shared_ride_driver_approval_required',
        data: { bookingId: booking._id, rideId: booking.ride._id }
      });

      emitToUser(booking.driver.toString(), 'newShareBookingRequest', {
        bookingId: booking._id,
        passengerName: booking.passenger.name,
        pickup: booking.pickupLocation.address,
        destination: booking.dropLocation.address,
        fare: booking.totalAmount
      });

      res.status(200).json({ success: true, message: 'Share approved, sent to driver', booking });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// @desc    Passenger 1 denies dynamic route sharing
// @route   PUT /api/bookings/:id/passenger-deny
// @access  Private (Passenger)
exports.passengerDenyShare = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Get Passenger 1's booking
    const u1Booking = await Booking.findOne({
      ride: booking.ride._id,
      status: 'confirmed',
      _id: { $ne: booking._id }
    });

    if (!u1Booking || u1Booking.passenger.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.passengerApprovalStatus = 'denied';
    booking.status = 'rejected';
    await booking.save();

    // Restore ride seats
    const ride = await Ride.findById(booking.ride._id);
    ride.availableSeats += booking.seatsBooked;
    await ride.save();

    // Notify Passenger 2
    await Notification.create({
      user: booking.passenger._id,
      title: '❌ Shared Ride Request Denied',
      message: `The existing passenger denied the sharing request.`,
      type: 'booking_rejected',
      data: { bookingId: booking._id, rideId: booking.ride._id }
    });

    emitToUser(booking.passenger._id.toString(), 'shareRequestDenied', {
      bookingId: booking._id
    });

    res.status(200).json({ success: true, message: 'Share denied', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Driver marks arrival at passenger pickup
// @route   PUT /api/bookings/:id/driver-arrived
// @access  Private (Driver)
exports.driverArrived = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.driverArrivedAt = new Date();
    await booking.save();

    // Notify passenger
    await Notification.create({
      user: booking.passenger,
      title: '📍 Driver Has Arrived',
      message: 'Your driver has reached the pickup location.',
      type: 'driver_arrived',
      data: { bookingId: booking._id, rideId: booking.ride._id }
    });

    emitToUser(booking.passenger.toString(), 'driverArrived', { bookingId: booking._id });

    res.status(200).json({ success: true, message: 'Arrival marked successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Passenger boards / checked-in (marks passenger arrival, calculates late fee)
// @route   PUT /api/bookings/:id/passenger-arrived
// @access  Private (Driver)
exports.passengerArrived = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.passengerArrivedAt = new Date();
    
    // Check waiting penalty: ₹1 per minute of delay after driver arrived
    let lateMinutes = 0;
    let lateCharge = 0;
    
    if (booking.driverArrivedAt) {
      const diffMs = booking.passengerArrivedAt - booking.driverArrivedAt;
      lateMinutes = Math.floor(diffMs / 60000);
      if (lateMinutes > 0) {
        lateCharge = lateMinutes * 1; // ₹1 per minute
        booking.passengerLateMinutes = lateMinutes;
        booking.passengerLateCharge = lateCharge;
        
        // Add to Passenger 2's fare
        booking.totalAmount += lateCharge;
        
        // Deduct from Passenger 1's savings/fare if Passenger 1 exists
        const u1Booking = await Booking.findOne({
          ride: booking.ride._id,
          status: 'confirmed',
          _id: { $ne: booking._id }
        });
        
        if (u1Booking) {
          u1Booking.totalAmount = Math.max(30, u1Booking.totalAmount - lateCharge);
          u1Booking.sharedRideAdjustment = (u1Booking.sharedRideAdjustment || 0) + lateCharge;
          await u1Booking.save();

          // Notify Passenger 1 of deduction transfer
          await Notification.create({
            user: u1Booking.passenger,
            title: '⚠️ Shared Ride Late Adjustment',
            message: `Passenger 2 was ${lateMinutes} min late. ₹${lateCharge} has been credited to your fare.`,
            type: 'fare_updated',
            data: { bookingId: u1Booking._id, rideId: booking.ride._id }
          });
          emitToUser(u1Booking.passenger.toString(), 'fareUpdated', {
            bookingId: u1Booking._id,
            newFare: u1Booking.totalAmount
          });
        }

        // Notify Passenger 2 of waiting charge
        await Notification.create({
          user: booking.passenger,
          title: '⚠️ Late Waiting Charge Applied',
          message: `You were ${lateMinutes} minutes late. Surcharge of ₹${lateCharge} applied to your fare.`,
          type: 'late_charge_applied',
          data: { bookingId: booking._id, rideId: booking.ride._id }
        });
        emitToUser(booking.passenger.toString(), 'lateChargeApplied', {
          bookingId: booking._id,
          lateMinutes,
          charge: lateCharge,
          newFare: booking.totalAmount
        });

        // Credit driver's wallet with the waiting earnings
        await adjustWalletBalance(
          booking.driver,
          'EARNINGS',
          lateCharge,
          `Late arrival penalty fee earnings for booking ${booking._id}`,
          booking._id.toString()
        );
      }
    }

    await booking.save();

    res.status(200).json({ success: true, message: 'Passenger marked as boarded', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update traffic delay and surcharge dynamically (₹5 for every 120s of delay)
// @route   PUT /api/bookings/ride/:rideId/traffic
// @access  Private (Driver)
exports.updateTrafficDelay = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { trafficDelaySeconds } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const previousDelay = ride.trafficDelaySeconds || 0;
    const newDelay = parseInt(trafficDelaySeconds);
    
    ride.trafficDelaySeconds = newDelay;
    // ₹5 surcharge for every 120 seconds of traffic delay
    const trafficCharge = Math.floor(newDelay / 120) * 5;
    ride.trafficCharge = trafficCharge;
    await ride.save();

    // Update all active bookings
    const bookings = await Booking.find({ ride: rideId, status: 'confirmed' });
    for (const booking of bookings) {
      const prevCharge = booking.trafficCharge || 0;
      const chargeDiff = trafficCharge - prevCharge;
      
      booking.trafficDelaySeconds = newDelay;
      booking.trafficCharge = trafficCharge;
      booking.totalAmount += chargeDiff;
      await booking.save();

      // Notify passenger
      await Notification.create({
        user: booking.passenger,
        title: '🚦 Traffic Delay Surcharge Applied',
        message: `Traffic delay of ${Math.round(newDelay / 60)} min detected. Surcharge: ₹${trafficCharge}.`,
        type: 'fare_updated',
        data: { bookingId: booking._id, rideId }
      });
      emitToUser(booking.passenger.toString(), 'fareUpdated', {
        bookingId: booking._id,
        newFare: booking.totalAmount,
        trafficDelay: newDelay,
        trafficCharge
      });
    }

    res.status(200).json({ success: true, message: 'Traffic delay updated successfully', trafficCharge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};