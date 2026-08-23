const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  calculateCarbon,
  predictPricing,
  predictDemand,
  rideMatch,
  calculateSafety,
  handleChatQuery
} = require('../controllers/aiController');

router.post('/carbon', protect, calculateCarbon);
router.post('/pricing', protect, predictPricing);
router.post('/demand', protect, predictDemand);
router.post('/match', protect, rideMatch);
router.post('/safety', protect, calculateSafety);
router.post('/chat', protect, handleChatQuery);

module.exports = router;