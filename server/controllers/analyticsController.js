const User = require('../models/User');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const RewardRedemption = require('../models/RewardRedemption');
const CarbonRecord = require('../models/CarbonRecord');

// @desc    Get user activity summary & analytics
// @route   GET /api/analytics/summary
// @access  Private
exports.getUserSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // 1. Gather bookings
    const bookings = await Booking.find({ passenger: req.user.id }).populate('ride');
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    // 2. Compute spending
    const payments = await Payment.find({ user: req.user.id, status: 'captured' });
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Compute distance & carbon saved
    const distanceShared = completedBookings.reduce((sum, b) => sum + (b.ride?.distance || 0), 0);
    const co2Saved = parseFloat((distanceShared * 0.18).toFixed(1));

    // 4. Generate ride activity months map (time-series chart data)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = {};
    
    // Seed latest 6 months
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      monthlyStats[monthNames[idx]] = 0;
    }

    completedBookings.forEach(b => {
      const month = new Date(b.createdAt).getMonth();
      const name = monthNames[month];
      if (monthlyStats[name] !== undefined) {
        monthlyStats[name] += 1;
      }
    });

    const rideActivity = Object.keys(monthlyStats).map(key => ({
      name: key,
      value: monthlyStats[key] || 0
    }));

    res.json({
      success: true,
      summary: {
        totalRides: bookings.length,
        completedRides: completedBookings.length,
        cancelledRides: bookings.filter(b => b.status === 'cancelled').length,
        distanceShared,
        co2Saved: user.totalCO2Saved || co2Saved,
        totalSpent,
        ecoPoints: user.ecoPoints || 100,
        ecoLevel: user.ecoLevel || 'Seedling'
      },
      chartData: {
        rideActivity,
        spendingTrends: [
          { name: 'Wk 1', value: Math.round(totalSpent * 0.1) },
          { name: 'Wk 2', value: Math.round(totalSpent * 0.25) },
          { name: 'Wk 3', value: Math.round(totalSpent * 0.4) },
          { name: 'Wk 4', value: totalSpent }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get driver specific performance metrics
// @route   GET /api/analytics/driver
// @access  Private
exports.getDriverMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'driver' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Driver credentials required.' });
    }

    // 1. Calculate driver rides
    const rides = await Ride.find({ driver: req.user.id });
    const completedRides = rides.filter(r => r.status === 'completed');

    // 2. Fetch driver reviews to compute stars breakdown
    const reviews = await Review.find({ ratingTo: req.user.id });
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = Math.round(r.rating);
      if (ratingBreakdown[rating] !== undefined) {
        ratingBreakdown[rating] += 1;
      }
    });

    // 3. Compute Composite Driver Performance score (max 100)
    const reliability = Math.max(60, Math.min(100, Math.round(100 - (user.cancellationCount * 5))));
    const ratingsPercentage = Math.round((user.averageRating || 4.5) * 20);
    const performanceScore = Math.round((reliability * 0.4) + (ratingsPercentage * 0.6));

    // 4. Calculate total earnings (mocking increments based on completed rides fares)
    const totalEarnings = completedRides.reduce((sum, r) => sum + (r.price || 0), 0);

    res.json({
      success: true,
      metrics: {
        completedRides: completedRides.length,
        averageRating: user.averageRating || 4.5,
        totalRatings: user.totalRatings || 0,
        cancellationRate: parseFloat(((user.cancellationCount / (rides.length || 1)) * 100).toFixed(0)),
        performanceScore,
        reliabilityScore: reliability,
        efficiencyScore: 90,
        totalEarnings
      },
      ratingBreakdown,
      earningsChart: [
        { name: 'Mon', value: Math.round(totalEarnings * 0.15) },
        { name: 'Tue', value: Math.round(totalEarnings * 0.3) },
        { name: 'Wed', value: Math.round(totalEarnings * 0.5) },
        { name: 'Thu', value: Math.round(totalEarnings * 0.65) },
        { name: 'Fri', value: totalEarnings }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Redeem accumulated eco points for coupon rewards
// @route   POST /api/analytics/rewards/redeem
// @access  Private
exports.redeemEcoPoints = async (req, res) => {
  try {
    const { rewardId } = req.body;
    if (!rewardId) {
      return res.status(400).json({ success: false, message: 'rewardId parameter is required' });
    }

    const user = await User.findById(req.user.id);
    let cost = 0;
    let rewardName = '';

    if (rewardId === 'DISCOUNT_50') {
      cost = 500;
      rewardName = '₹50 Ride Discount Coupon';
    } else if (rewardId === 'DISCOUNT_100') {
      cost = 900;
      rewardName = '₹100 Ride Discount Coupon';
    } else if (rewardId === 'PREMIUM_PERK') {
      cost = 300;
      rewardName = 'Premium Badge Overlay';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid reward selection' });
    }

    // Anti-fraud: Verify user points balance
    if (user.ecoPoints < cost) {
      return res.status(400).json({ success: false, message: 'Insufficient Eco Points balance.' });
    }

    // Deduct points safely server-side
    user.ecoPoints -= cost;
    user.updateEcoLevel();
    await user.save({ validateBeforeSave: false });

    // Generate coupon code
    const couponCode = 'ECO-RED-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const redemption = await RewardRedemption.create({
      user: user._id,
      rewardId,
      rewardName,
      pointsCost: cost,
      couponCode,
      status: 'active'
    });

    res.json({
      success: true,
      message: `${rewardName} redeemed successfully!`,
      couponCode,
      ecoPoints: user.ecoPoints,
      ecoLevel: user.ecoLevel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user rewards coupon code ledger
// @route   GET /api/analytics/rewards/my-rewards
// @access  Private
exports.getMyRewards = async (req, res) => {
  try {
    const rewards = await RewardRedemption.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
