const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  banUser,
  verifyDriver,
  getAllRides,
  deleteRide
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/verify-driver', verifyDriver);
router.get('/rides', getAllRides);
router.delete('/rides/:id', deleteRide);

module.exports = router;