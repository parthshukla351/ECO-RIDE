const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateCarbonEmission } = require('../utils/carbonCalculator');
const { emitToUser } = require('../sockets/socketManager');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (Passenger)
exports.createBooking = async (req, res) => {
  try {
    const { rideId, seatsBooked, pickupLocation, dropLocation } = req.body;

    // Get ride
    const ride = await Ride.findById(rideId).populate('driver');
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
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

    // Calculate carbon saved
    const carbonData = calculateCarbonEmission(
      ride.distance,
      ride.vehicleType,
      seatsBooked
    );

    // Create booking
    const totalAmount = seatsBooked * ride.pricePerSeat;

    const booking = await Booking.create({
      ride: rideId,
      passenger: req.user.id,
      driver: ride.driver._id,
      seatsBooked,
      pricePerSeat: ride.pricePerSeat,
      totalAmount,
      pickupLocation: pickupLocation || ride.origin,
      dropLocation: dropLocation || ride.destination,
      carbonSaved: carbonData.carbonSaved,
      ecoPointsEarned: carbonData.ecoPoints,
      status: 'pending'
    });

    // Update ride seats
    ride.availableSeats -= seatsBooked;
    ride.bookings.push(booking._id);
    await ride.save();

    // Notify driver
    await Notification.create({
      user: ride.driver._id,
      title: '🎉 New Booking Request',
      message: `${req.user.name} requested ${seatsBooked} seat(s) for your ride`,
      type: 'booking_confirmed',
      data: { bookingId: booking._id, rideId }
    });

    emitToUser(ride.driver._id.toString(), 'newBooking', {
      bookingId: booking._id,
      passenger: {
        name: req.user.name,
        avatar: req.user.avatar
      },
      seatsBooked
    });

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
    await booking.save();

    // Restore ride seats
    const ride = await Ride.findById(booking.ride._id);
    ride.availableSeats += booking.seatsBooked;
    ride.bookings = ride.bookings.filter(b => b.toString() !== booking._id.toString());
    await ride.save();

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