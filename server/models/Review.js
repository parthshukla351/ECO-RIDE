const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    enum: ['punctual', 'friendly', 'safe_driver', 'clean_car', 'good_route', 
           'music_lover', 'quiet', 'eco_conscious', 'helpful', 'professional']
  }],
  reviewType: {
    type: String,
    enum: ['passenger_to_driver', 'driver_to_passenger'],
    required: true
  },
  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

// Prevent duplicate reviews
reviewSchema.index({ reviewer: 1, booking: 1 }, { unique: true });

// Update user average rating after review
reviewSchema.post('save', async function() {
  const User = mongoose.model('User');
  const reviews = await this.constructor.find({ reviewee: this.reviewee });
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  await User.findByIdAndUpdate(this.reviewee, {
    averageRating: Math.round(avgRating * 10) / 10,
    totalRatings: reviews.length
  });
});

module.exports = mongoose.model('Review', reviewSchema);