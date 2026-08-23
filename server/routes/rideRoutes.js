const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createRide,
  searchRides,
  getRide,
  getMyRides,
  updateRide,
  cancelRide,
  startRide,
  endRide,
  updateLocation,
  smartSearchRides,
  getRecommendations
} = require('../controllers/rideController');

const { getRideSeats, lockRideSeats, releaseRideSeats } = require('../controllers/seatController');

router.post('/create', protect, authorize('driver'), createRide);
router.get('/search', searchRides);
router.post('/smart-search', smartSearchRides);
router.get('/personalized/recommendations', protect, getRecommendations);
router.get('/driver/my-rides', protect, authorize('driver'), getMyRides);
router.get('/:rideId/seats', protect, getRideSeats);
router.post('/:rideId/seats/lock', protect, authorize('passenger'), lockRideSeats);
router.post('/:rideId/seats/release', protect, authorize('passenger'), releaseRideSeats);
router.get('/:id', getRide);
router.put('/:id', protect, authorize('driver'), updateRide);
router.put('/:id/cancel', protect, authorize('driver'), cancelRide);
router.put('/:id/start', protect, authorize('driver'), startRide);
router.put('/:id/end', protect, authorize('driver'), endRide);
router.post('/:id/location', protect, updateLocation);

module.exports = router;
