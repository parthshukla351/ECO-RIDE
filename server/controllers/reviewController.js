const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, tags } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('passenger')
      .populate('driver');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed rides'
      });
    }

    const isPassenger = booking.passenger._id.toString() === req.user.id;
    const isDriver = booking.driver._id.toString() === req.user.id;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      booking: bookingId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this ride'
      });
    }

    const reviewee = isPassenger ? booking.driver._id : booking.passenger._id;
    const reviewType = isPassenger ? 'passenger_to_driver' : 'driver_to_passenger';

    const review = await Review.create({
      reviewer: req.user.id,
      reviewee,
      ride: booking.ride,
      booking: bookingId,
      rating,
      comment,
      tags,
      reviewType
    });

    // Update booking
    if (isPassenger) {
      booking.driverRating = rating;
    } else {
      booking.passengerRating = rating;
    }
    await booking.save();

    // Notify reviewee
    await Notification.create({
      user: reviewee,
      title: '⭐ New Review Received',
      message: `${req.user.name} rated you ${rating} stars`,
      type: 'review_received',
      data: { reviewId: review._id, rating }
    });

    res.status(201).json({
      success: true,
      message: '✅ Review submitted!',
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      reviewee: req.params.userId,
      isVisible: true
    })
      .populate('reviewer', 'name avatar')
      .populate('ride', 'origin destination departureTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      reviewee: req.params.userId,
      isVisible: true
    });

    const stats = await Review.aggregate([
      { $match: { reviewee: req.params.userId, isVisible: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    stats.forEach(s => {
      ratingDistribution[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      reviews,
      total,
      pages: Math.ceil(total / limit),
      ratingDistribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my reviews (given by me)
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user.id })
      .populate('reviewee', 'name avatar')
      .populate('ride', 'origin destination')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};