const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendTokenResponse, generateAccessToken } = require('../utils/generateToken');
const { sendWelcomeEmail, sendOTPEmail, sendResetOTPEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, password, phone, role, gender, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.'
      });
    }

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      referredBy = await User.findOne({ referralCode });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name, email, password, phone, 
      role: role || 'passenger',
      gender,
      referredBy: referredBy?._id,
      otp,
      otpExpire
    });

    // Log OTP to console for development
    console.log(`📱 [DEV] OTP for ${email}: ${otp}`);
    console.log(`📱 [DEV] OTP expires: ${otpExpire}`);

    // Send OTP email (don't block registration if email fails)
    try {
      await sendOTPEmail(user, otp);
    } catch (emailError) {
      console.warn(`⚠️ Email sending failed: ${emailError.message}`);
      console.log(`📱 [DEV] Use OTP: ${otp} to verify`);
    }

    // If referred, give referral bonus
    if (referredBy) {
      await referredBy.addEcoPoints(200);
      referredBy.referralCount += 1;
      await referredBy.save({ validateBeforeSave: false });
    }

    res.status(201).json({
      success: true,
      message: `Registration successful! Please verify your email with the OTP sent. [DEV ONLY: Use OTP ${otp} to verify]`,
      userId: user._id,
      otp
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    if (user.otp !== otp || user.otpExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    await sendWelcomeEmail(user);

    // Create welcome notification
    await Notification.create({
      user: user._id,
      title: '🌱 Welcome to EcoRide AI!',
      message: 'Your account is verified. You earned 100 Eco Points as welcome bonus!',
      type: 'system'
    });

    sendTokenResponse(user, 200, res, 'Email verified successfully! Welcome to EcoRide AI 🌱');

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(user, otp);

    res.status(200).json({
      success: true,
      message: `OTP resent successfully! [DEV ONLY: Use OTP ${otp} to verify]`,
      otp
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        userId: user._id,
        needsVerification: true
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Account banned: ${user.banReason || 'Contact support'}`
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful', rememberMe);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('referredBy', 'name email');
    
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account with this email' });
    }

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendResetOTPEmail(user, otp);

    res.status(200).json({ 
      success: true, 
      message: `Password reset OTP sent to email. [DEV ONLY: Use OTP ${otp} to reset]`,
      userId: user._id,
      otp
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.resetPasswordToken !== otp || user.resetPasswordExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    let token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided. Please login again.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token owner not found.'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    res.status(200).json({
      success: true,
      token: accessToken
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please login again.'
    });
  }
};