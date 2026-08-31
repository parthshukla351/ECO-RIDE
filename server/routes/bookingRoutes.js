const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  getDriverBookings,
  getBooking,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  passengerApproveShare,
  passengerDenyShare,
  driverArrived,
  passengerArrived,
  updateTrafficDelay
} = require('../controllers/bookingController');

router.post('/', protect, authorize('passenger'), createBooking);
router.get('/my-bookings', protect, authorize('passenger'), getMyBookings);
router.get('/driver/requests', protect, authorize('driver'), getDriverBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/confirm', protect, authorize('driver'), confirmBooking);
router.put('/:id/reject', protect, authorize('driver'), rejectBooking);
router.put('/:id/cancel', protect, cancelBooking);

// Phase 9 approvals and surcharges
router.put('/:id/passenger-approve', protect, authorize('passenger'), passengerApproveShare);
router.put('/:id/passenger-deny', protect, authorize('passenger'), passengerDenyShare);
router.put('/:id/driver-arrived', protect, authorize('driver'), driverArrived);
router.put('/:id/passenger-arrived', protect, authorize('driver'), passengerArrived);
router.put('/ride/:rideId/traffic', protect, authorize('driver'), updateTrafficDelay);

module.exports = router;