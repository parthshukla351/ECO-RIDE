const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentStats
} = require('../controllers/paymentController');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/stats', protect, authorize('driver'), getPaymentStats);

module.exports = router;