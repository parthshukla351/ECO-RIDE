const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserSummary,
  getDriverMetrics,
  redeemEcoPoints,
  getMyRewards
} = require('../controllers/analyticsController');

router.get('/summary', protect, getUserSummary);
router.get('/driver', protect, getDriverMetrics);
router.get('/rewards/my-rewards', protect, getMyRewards);
router.post('/rewards/redeem', protect, redeemEcoPoints);

module.exports = router;
