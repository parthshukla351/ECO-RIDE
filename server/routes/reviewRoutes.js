const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReview,
  getUserReviews,
  getMyReviews,
  deleteReview
} = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/my-reviews', protect, getMyReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;