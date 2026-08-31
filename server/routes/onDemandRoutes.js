const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  updateDriverLocation,
  getNearbyDrivers
} = require('../controllers/onDemandController');

router.post('/request', protect, authorize('passenger'), createRequest);
router.post('/accept', protect, authorize('driver'), acceptRequest);
router.post('/decline', protect, authorize('driver'), declineRequest);
router.post('/cancel', protect, authorize('passenger'), cancelRequest);
router.post('/location', protect, authorize('driver'), updateDriverLocation);
router.get('/nearby', protect, getNearbyDrivers);

module.exports = router;
