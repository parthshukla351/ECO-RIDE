const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalPassengers = await User.countDocuments({ role: 'passenger' });
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const activeRides = await Ride.countDocuments({ status: { $in: ['scheduled', 'in_progress'] } });
    const totalBookings = await Booking.countDocuments();

    const revenue = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const carbonSaved = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCO2Saved' } } }
    ]);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const ridesThisMonth = await Ride.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          passengers: totalPassengers,
          newThisMonth: newUsersThisMonth
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          active: activeRides,
          thisMonth: ridesThisMonth
        },
        bookings: { total: totalBookings },
        revenue: revenue[0]?.total || 0,
        carbonSaved: carbonSaved[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin)
exports.banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    if (user.isBanned) user.banReason = reason || 'Violation of terms';
    else user.banReason = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? 'User banned' : 'User unbanned',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify driver
// @route   PUT /api/admin/users/:id/verify-driver
// @access  Private (Admin)
exports.verifyDriver = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'driver') {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    user.isDriverVerified = true;
    user.driverLicense.verified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Driver verified',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all rides
// @route   GET /api/admin/rides
// @access  Private (Admin)
exports.getAllRides = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const rides = await Ride.find(query)
      .populate('driver', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ride.countDocuments(query);

    res.status(200).json({
      success: true,
      rides,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete ride
// @route   DELETE /api/admin/rides/:id
// @access  Private (Admin)
exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    await ride.deleteOne();

    res.status(200).json({ success: true, message: 'Ride deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};