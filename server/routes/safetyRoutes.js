const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  triggerSOS,
  resolveSOS,
  getSOSIncidents,
  createShareSession,
  getShareSessionDetails,
  revokeShareSession,
  submitVerification,
  reviewVerification
} = require('../controllers/safetyController');

// 1. Contacts Management
router.route('/contacts')
  .get(protect, getContacts)
  .post(protect, addContact);

router.route('/contacts/:id')
  .put(protect, updateContact)
  .delete(protect, deleteContact);

// 2. SOS Triggers
router.route('/sos')
  .get(protect, getSOSIncidents)
  .post(protect, triggerSOS);

router.put('/sos/:id/resolve', protect, resolveSOS);

// 3. Temporary Live Sharing
router.post('/share', protect, createShareSession);
router.get('/share/:token', getShareSessionDetails); // PUBLIC tracking (unauthenticated)
router.put('/share/:token/revoke', protect, revokeShareSession);

// 4. Verification Reviews
router.post('/verify', protect, submitVerification);
router.put('/verify/:userId', protect, authorize('admin'), reviewVerification);

module.exports = router;
