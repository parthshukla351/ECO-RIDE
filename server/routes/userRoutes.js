const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  getEcoStats
} = require('../controllers/userController');

router.get('/profile/:id', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/eco-stats', protect, getEcoStats);

module.exports = router;