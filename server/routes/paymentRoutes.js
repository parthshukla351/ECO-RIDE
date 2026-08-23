const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentStats,
  calculateFareEndpoint,
  payWithWallet,
  topUpWallet,
  verifyWalletTopUp,
  getWalletInfo
} = require('../controllers/paymentController');

router.post('/calculate-fare', protect, calculateFareEndpoint);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/pay-wallet', protect, payWithWallet);
router.get('/wallet', protect, getWalletInfo);
router.post('/wallet/top-up', protect, topUpWallet);
router.post('/wallet/verify-top-up', protect, verifyWalletTopUp);
router.get('/history', protect, getPaymentHistory);
router.get('/stats', protect, authorize('driver'), getPaymentStats);

module.exports = router;