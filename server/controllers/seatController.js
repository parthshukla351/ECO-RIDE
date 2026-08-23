const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const SeatLock = require('../models/SeatLock');

// @desc    Get ride seat status
// @route   GET /api/rides/:rideId/seats
// @access  Private (Authenticated)
exports.getRideSeats = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Find confirmed or pending bookings
    const bookings = await Booking.find({
      ride: rideId,
      status: { $in: ['pending', 'confirmed'] }
    });

    // Find active locks
    const locks = await SeatLock.find({
      ride: rideId,
      expiresAt: { $gt: new Date() }
    });

    const occupiedSeats = [];
    bookings.forEach(b => {
      if (b.seats && b.seats.length > 0) {
        occupiedSeats.push(...b.seats);
      } else {
        // Fallback matching for older records
        for (let i = 1; i <= b.seatsBooked; i++) {
          occupiedSeats.push(i);
        }
      }
    });

    const lockedSeatsMap = {};
    locks.forEach(l => {
      lockedSeatsMap[l.seatNumber] = {
        lockedBy: l.lockedBy,
        isOwnLock: req.user ? l.lockedBy.toString() === req.user.id : false
      };
    });

    const seats = [];
    const totalSeats = ride.totalSeats || 4;

    for (let i = 1; i <= totalSeats; i++) {
      let status = 'AVAILABLE';
      let lockInfo = null;

      if (occupiedSeats.includes(i)) {
        status = 'OCCUPIED';
      } else if (lockedSeatsMap[i]) {
        status = 'LOCKED';
        lockInfo = lockedSeatsMap[i];
      }

      seats.push({
        seatNumber: i,
        status,
        lockInfo
      });
    }

    res.status(200).json({
      success: true,
      rideId,
      totalSeats,
      seats,
      availableCount: seats.filter(s => s.status === 'AVAILABLE').length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acquire temporary lock on seats
// @route   POST /api/rides/:rideId/seats/lock
// @access  Private (Passenger)
exports.lockRideSeats = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Please specify seats to lock' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const maxSeats = ride.totalSeats || 4;
    for (const seatNum of seats) {
      if (seatNum < 1 || seatNum > maxSeats) {
        return res.status(400).json({ success: false, message: `Invalid seat number ${seatNum}` });
      }
    }

    // DB Double Check Bookings
    const alreadyBooked = await Booking.findOne({
      ride: rideId,
      status: { $in: ['pending', 'confirmed'] },
      seats: { $in: seats }
    });
    if (alreadyBooked) {
      return res.status(400).json({ success: false, message: 'One or more selected seats are already booked' });
    }

    // Check existing locks
    const activeLocks = await SeatLock.find({
      ride: rideId,
      seatNumber: { $in: seats },
      lockedBy: { $ne: req.user.id },
      expiresAt: { $gt: new Date() }
    });
    if (activeLocks.length > 0) {
      return res.status(400).json({ success: false, message: 'One or more seats are locked by another passenger' });
    }

    // Clean user's older locks on these exact seats
    await SeatLock.deleteMany({
      ride: rideId,
      seatNumber: { $in: seats },
      lockedBy: req.user.id
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min timeout
    const locksToCreate = seats.map(s => ({
      ride: rideId,
      seatNumber: s,
      lockedBy: req.user.id,
      expiresAt
    }));

    await SeatLock.insertMany(locksToCreate);

    // Emit live updates to sockets
    const io = require('../sockets/socketManager').getIO?.() || null;
    if (io) {
      io.to(rideId.toString()).emit('seatsLocked', { rideId, seats, lockedBy: req.user.id });
    }

    res.status(200).json({ success: true, message: 'Seats locked successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'One or more selected seats were just locked by another passenger' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Release acquired locks
// @route   POST /api/rides/:rideId/seats/release
// @access  Private (Passenger)
exports.releaseRideSeats = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seats } = req.body;

    const filter = { ride: rideId, lockedBy: req.user.id };
    if (seats && Array.isArray(seats)) {
      filter.seatNumber = { $in: seats };
    }

    await SeatLock.deleteMany(filter);

    const io = require('../sockets/socketManager').getIO?.() || null;
    if (io) {
      io.to(rideId.toString()).emit('seatsReleased', { rideId });
    }

    res.status(200).json({ success: true, message: 'Seats released successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
