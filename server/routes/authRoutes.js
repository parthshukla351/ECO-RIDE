const express = require('express');
const router = express.Router();
const { registerValidation } = require('../validations/authValidation');
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerValidation, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;