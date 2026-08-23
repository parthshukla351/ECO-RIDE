const crypto = require('crypto');
const EmergencyContact = require('../models/EmergencyContact');
const SafetyIncident = require('../models/SafetyIncident');
const ShareSession = require('../models/ShareSession');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { emitToUser, emitToRide, getIO } = require('../sockets/socketManager');

// ==========================================
// 1. EMERGENCY CONTACTS MANAGEMENT
// ==========================================

// @desc    Get passenger emergency contacts
// @route   GET /api/safety/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user.id }).sort({ isPrimary: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add emergency contact
// @route   POST /api/safety/contacts
// @access  Private
exports.addContact = async (req, res) => {
  try {
    const { name, phone, relationship, isPrimary, autoShare } = req.body;

    if (!name || !phone || !relationship) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Phone format verification
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
    }

    // Duplicate check
    const existing = await EmergencyContact.findOne({ user: req.user.id, phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Contact phone number already exists' });
    }

    // Handle primary contact override
    if (isPrimary) {
      await EmergencyContact.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    const contact = await EmergencyContact.create({
      user: req.user.id,
      name,
      phone,
      relationship,
      isPrimary: !!isPrimary,
      autoShare: !!autoShare
    });

    res.status(201).json({ success: true, message: 'Emergency contact added', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update emergency contact
// @route   PUT /api/safety/contacts/:id
// @access  Private
exports.updateContact = async (req, res) => {
  try {
    const { name, phone, relationship, isPrimary, autoShare } = req.body;
    let contact = await EmergencyContact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Enforce ownership
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this contact' });
    }

    // Validate phone pattern if updating
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
    }

    // Handle primary contact override
    if (isPrimary) {
      await EmergencyContact.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    contact.name = name || contact.name;
    contact.phone = phone || contact.phone;
    contact.relationship = relationship || contact.relationship;
    contact.isPrimary = isPrimary !== undefined ? !!isPrimary : contact.isPrimary;
    contact.autoShare = autoShare !== undefined ? !!autoShare : contact.autoShare;

    await contact.save();

    res.status(200).json({ success: true, message: 'Emergency contact updated', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/safety/contacts/:id
// @access  Private
exports.deleteContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Enforce ownership
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this contact' });
    }

    await contact.deleteOne();

    res.status(200).json({ success: true, message: 'Emergency contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. SOS TRIGGERS & INCIDENT REPORTING
// ==========================================

// @desc    Trigger active SOS emergency incident
// @route   POST /api/safety/sos
// @access  Private
exports.triggerSOS = async (req, res) => {
  try {
    const { rideId, bookingId, lat, lng, accuracy } = req.body;

    if (!rideId || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Ride ID and location coordinates are required' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const incident = await SafetyIncident.create({
      user: req.user.id,
      ride: rideId,
      booking: bookingId,
      status: 'TRIGGERED',
      location: { lat, lng, accuracy }
    });

    // Notify sockets
    try {
      const io = getIO();
      // Notify active ride occupants
      io.to(`ride_${rideId}`).emit('sosAlertTriggered', {
        incidentId: incident._id,
        user: { id: req.user.id, name: req.user.name },
        location: { lat, lng }
      });
      // Global emit for admin dashboards
      io.emit('sosReceived', {
        incidentId: incident._id,
        userId: req.user.id,
        userName: req.user.name,
        rideId,
        location: { lat, lng },
        timestamp: new Date()
      });
    } catch (socketError) {
      console.warn('Socket emit failed for SOS:', socketError.message);
    }

    // Send in-app notification to the primary emergency contact if matching database user is found
    const primaryContact = await EmergencyContact.findOne({ user: req.user.id, isPrimary: true });
    if (primaryContact) {
      // Find if this primary contact phone corresponds to a registered Eco-Ride user
      const contactUser = await User.findOne({ phone: primaryContact.phone });
      if (contactUser) {
        await Notification.create({
          user: contactUser._id,
          title: '🚨 Emergency SOS Triggered!',
          message: `${req.user.name} has triggered an SOS alert on their trip from ${ride.origin?.city} to ${ride.destination?.city}. Track location now.`,
          type: 'sos_alert',
          data: { rideId, incidentId: incident._id }
        });
        emitToUser(contactUser._id.toString(), 'notification', { title: '🚨 SOS Alert', message: `${req.user.name} is in emergency.` });
      }
    }

    res.status(201).json({ success: true, message: '🚨 Emergency SOS activated!', incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge/Resolve safety incident
// @route   PUT /api/safety/sos/:id/resolve
// @access  Private (Admin / Owner)
exports.resolveSOS = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const incident = await SafetyIncident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    // Authorization: Triggerer user or admin
    if (incident.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve this incident' });
    }

    incident.status = status || 'RESOLVED';
    if (incident.status === 'RESOLVED') {
      incident.resolvedAt = new Date();
    }
    incident.resolutionNotes = notes || incident.resolutionNotes;

    await incident.save();

    // Notify room of resolution
    try {
      getIO().to(`ride_${incident.ride.toString()}`).emit('sosAlertResolved', {
        incidentId: incident._id,
        status: incident.status
      });
    } catch (err) {}

    res.status(200).json({ success: true, message: `SOS Status set to ${incident.status}`, incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get SOS safety incidents list
// @route   GET /api/safety/sos
// @access  Private (Admin / Authorized user)
exports.getSOSIncidents = async (req, res) => {
  try {
    let query = {};
    // Non-admins see only their own incidents
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const incidents = await SafetyIncident.find(query)
      .populate('user', 'name phone email')
      .populate({
        path: 'ride',
        populate: { path: 'driver', select: 'name phone vehicleDetails' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: incidents.length, incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. LIVE LOCATION SHARING SESSIONS
// ==========================================

// @desc    Create temporary live tracking session token
// @route   POST /api/safety/share
// @access  Private
exports.createShareSession = async (req, res) => {
  try {
    const { rideId } = req.body;

    if (!rideId) {
      return res.status(400).json({ success: false, message: 'Ride ID is required' });
    }

    // Expire in 4 hours from now
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    const session = await ShareSession.create({
      user: req.user.id,
      ride: rideId,
      token,
      expiresAt,
      status: 'ACTIVE'
    });

    res.status(201).json({ 
      success: true, 
      token, 
      expiresAt,
      shareUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/share/${token}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch ride tracking telemetry via token
// @route   GET /api/safety/share/:token
// @access  Public
exports.getShareSessionDetails = async (req, res) => {
  try {
    const session = await ShareSession.findOne({ token: req.params.token });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Tracking session not found or invalid' });
    }

    if (session.status !== 'ACTIVE' || session.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'Tracking link has expired or was revoked' });
    }

    const ride = await Ride.findById(session.ride)
      .populate('driver', 'name avatar averageRating totalRides safetyScore vehicleDetails')
      .select('-bookings'); // strip passenger lists

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride matching this session not found' });
    }

    // Expose only non-sensitive public safety telemetry
    res.status(200).json({
      success: true,
      expiresAt: session.expiresAt,
      ride: {
        origin: ride.origin,
        destination: ride.destination,
        waypoints: ride.waypoints,
        currentLocation: ride.currentLocation,
        departureTime: ride.departureTime,
        status: ride.status,
        distance: ride.distance,
        duration: ride.duration,
        driver: {
          name: ride.driver?.name,
          avatar: ride.driver?.avatar,
          rating: ride.driver?.averageRating,
          completedRides: ride.driver?.totalRides,
          safetyScore: ride.driver?.safetyScore,
          vehicle: ride.driver?.vehicleDetails
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Revoke sharing session immediately
// @route   PUT /api/safety/share/:token/revoke
// @access  Private
exports.revokeShareSession = async (req, res) => {
  try {
    const session = await ShareSession.findOne({ token: req.params.token });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.user.toString() !== req.user.id) {
      return res.status(430).json({ success: false, message: 'Not authorized to revoke this session' });
    }

    session.status = 'REVOKED';
    await session.save();

    res.status(200).json({ success: true, message: 'Location sharing session revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. DRIVER/VEHICLE VERIFICATION REVIEWS
// ==========================================

// @desc    Submit driver license / vehicle for review
// @route   POST /api/safety/verify
// @access  Private
exports.submitVerification = async (req, res) => {
  try {
    const { type, licenseNumber, licenseImage } = req.body;
    const user = await User.findById(req.user.id);

    if (type === 'driver') {
      if (!licenseNumber) return res.status(400).json({ success: false, message: 'License number is required' });
      user.driverLicense = {
        number: licenseNumber,
        image: licenseImage || user.driverLicense?.image,
        verified: false
      };
      user.driverVerificationStatus = 'PENDING';
    } else if (type === 'vehicle') {
      user.vehicleVerificationStatus = 'PENDING';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification type. Choose driver or vehicle' });
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Verification details submitted for review', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review / Approve / Reject verification (Admin only)
// @route   PUT /api/safety/verify/:userId
// @access  Private (Admin)
exports.reviewVerification = async (req, res) => {
  try {
    const { type, status } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!['VERIFIED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    if (type === 'driver') {
      user.driverVerificationStatus = status;
      if (status === 'VERIFIED') {
        user.isDriverVerified = true;
        user.driverLicense.verified = true;
        user.safetyScore = Math.min(100, user.safetyScore + 15); // reward points to trust rating
      } else {
        user.isDriverVerified = false;
        user.driverLicense.verified = false;
      }
    } else if (type === 'vehicle') {
      user.vehicleVerificationStatus = status;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    await user.save();

    await Notification.create({
      user: user._id,
      title: status === 'VERIFIED' ? '🎉 Verification Approved!' : '❌ Verification Rejected',
      message: status === 'VERIFIED' 
        ? `Your driver credentials have been approved! Your trust rating is now elevated.` 
        : `Your documents were rejected. Please review submission parameters.`,
      type: 'system'
    });

    res.status(200).json({ success: true, message: 'Verification state updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
