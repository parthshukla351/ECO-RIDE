const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation
const registerValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone required'),
  body('role').isIn(['passenger', 'driver']).withMessage('Role must be passenger or driver'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender is required')
];

router.post('/register', registerValidation, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;