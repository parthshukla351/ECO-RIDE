const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { sendBookingConfirmationEmail } = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('passenger')
      .populate('driver')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.passenger._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        passengerId: req.user.id,
        driverId: booking.driver._id.toString()
      }
    });

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      payer: req.user.id,
      payee: booking.driver._id,
      amount: booking.totalAmount,
      razorpayOrderId: order.id,
      status: 'created'
    });

    // Update booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: booking.totalAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update payment
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(bookingId)
      .populate('passenger')
      .populate('driver')
      .populate('ride');

    booking.paymentStatus = 'paid';
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    // Send confirmation email
    await sendBookingConfirmationEmail(booking.passenger, booking, booking.ride);

    // Notify driver
    await Notification.create({
      user: booking.driver._id,
      title: '💰 Payment Received',
      message: `Payment of ₹${booking.totalAmount} received for your ride`,
      type: 'payment_success',
      data: { bookingId: booking._id, amount: booking.totalAmount }
    });

    res.status(200).json({
      success: true,
      message: '✅ Payment successful!',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({
      $or: [{ payer: req.user.id }, { payee: req.user.id }]
    })
      .populate('booking')
      .populate('payer', 'name avatar')
      .populate('payee', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({
      $or: [{ payer: req.user.id }, { payee: req.user.id }]
    });

    res.status(200).json({
      success: true,
      payments,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment stats (Driver)
// @route   GET /api/payments/stats
// @access  Private (Driver)
exports.getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { payee: req.user._id, status: 'captured' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    const thisMonth = await Payment.aggregate([
      {
        $match: {
          payee: req.user._id,
          status: 'captured',
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          monthlyEarnings: { $sum: '$amount' },
          monthlyTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalEarnings: stats[0]?.totalEarnings || 0,
        totalTransactions: stats[0]?.totalTransactions || 0,
        averageTransaction: stats[0]?.averageTransaction || 0,
        monthlyEarnings: thisMonth[0]?.monthlyEarnings || 0,
        monthlyTransactions: thisMonth[0]?.monthlyTransactions || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};