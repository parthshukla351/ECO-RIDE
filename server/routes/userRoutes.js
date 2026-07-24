const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { calculateSafetyScore } = require('../utils/safetyScore');

// Get user profile
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -resetPasswordToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const safetyData = calculateSafetyScore(user);
    res.status(200).json({ success: true, user, safetyScore: safetyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'gender', 'vehicleDetails', 'preferences', 'driverLicense'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { 
      new: true, 
      runValidators: true 
    });

    res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ecoride/avatars',
      width: 300,
      height: 300,
      crop: 'fill'
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Avatar updated', avatar: result.secure_url, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get eco stats
router.get('/eco-stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const safetyScore = calculateSafetyScore(user);

    res.status(200).json({
      success: true,
      ecoStats: {
        ecoPoints: user.ecoPoints,
        ecoLevel: user.ecoLevel,
        totalCO2Saved: user.totalCO2Saved,
        totalRides: user.totalRides,
        totalDistance: user.totalDistanceTravelled,
        treesEquivalent: (user.totalCO2Saved / 21).toFixed(2),
        safetyScore: safetyScore.score,
        safetyLevel: safetyScore.level
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;