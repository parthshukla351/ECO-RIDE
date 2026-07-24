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
  cancelBooking
} = require('../controllers/bookingController');

router.post('/', protect, authorize('passenger'), createBooking);
router.get('/my-bookings', protect, authorize('passenger'), getMyBookings);
router.get('/driver/requests', protect, authorize('driver'), getDriverBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/confirm', protect, authorize('driver'), confirmBooking);
router.put('/:id/reject', protect, authorize('driver'), rejectBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;