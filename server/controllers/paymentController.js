const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const { sendBookingConfirmationEmail } = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Centralized Fare Calculation Helper
const calculateDetailedFare = (pricePerSeat, seatsBooked, distance = 0, vehicleType = 'petrol') => {
  const subtotal = pricePerSeat * seatsBooked;
  const baseFare = Math.max(30, Math.round(subtotal * 0.1));
  const distanceCharge = Math.round(subtotal * 0.7);
  const timeCharge = Math.round(subtotal * 0.2);
  const platformFee = 15;
  
  let discount = 0;
  if (vehicleType === 'electric' || vehicleType === 'hybrid') {
    discount = Math.round(subtotal * 0.1); // 10% eco discount
  }
  
  const taxableAmount = subtotal + platformFee - discount;
  const taxes = Math.round(taxableAmount * 0.05); // 5% GST
  
  const totalAmount = subtotal + platformFee + taxes - discount;
  
  return {
    subtotal,
    baseFare,
    distanceCharge,
    timeCharge,
    platformFee,
    taxes,
    discount,
    totalAmount
  };
};

// @desc    Calculate detailed fare breakdown
// @route   POST /api/payments/calculate-fare
// @access  Private
exports.calculateFareEndpoint = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('ride');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const fareDetails = calculateDetailedFare(
      booking.pricePerSeat,
      booking.seatsBooked,
      booking.ride?.distance || 0,
      booking.ride?.vehicleType || 'petrol'
    );

    res.status(200).json({ success: true, fareDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    // Authoritative fare validation
    const fareDetails = calculateDetailedFare(
      booking.pricePerSeat,
      booking.seatsBooked,
      booking.ride?.distance || 0,
      booking.ride?.vehicleType || 'petrol'
    );

    // Create Razorpay order with calculated totalAmount (in paise)
    const order = await razorpay.orders.create({
      amount: fareDetails.totalAmount * 100,
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
      amount: fareDetails.totalAmount,
      razorpayOrderId: order.id,
      status: 'created'
    });

    // Update booking order id
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: fareDetails.totalAmount,
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
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // Update booking details
    const booking = await Booking.findById(bookingId)
      .populate('passenger')
      .populate('driver')
      .populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Re-verify authoritative amount
    const fareDetails = calculateDetailedFare(
      booking.pricePerSeat,
      booking.seatsBooked,
      booking.ride?.distance || 0,
      booking.ride?.vehicleType || 'petrol'
    );

    booking.paymentStatus = 'paid';
    booking.paymentId = razorpay_payment_id;
    booking.totalAmount = fareDetails.totalAmount; // Set authoritative total
    booking.status = 'confirmed'; // Auto confirm paid rides
    await booking.save();

    // Send confirmation email
    await sendBookingConfirmationEmail(booking.passenger, booking, booking.ride);

    // Notify driver
    await Notification.create({
      user: booking.driver._id,
      title: '💰 Payment Received',
      message: `Payment of ₹${fareDetails.totalAmount} received for your ride`,
      type: 'payment_success',
      data: { bookingId: booking._id, amount: fareDetails.totalAmount }
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

// @desc    Pay ride booking using wallet balance
// @route   POST /api/payments/pay-wallet
// @access  Private
exports.payWithWallet = async (req, res) => {
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

    const fareDetails = calculateDetailedFare(
      booking.pricePerSeat,
      booking.seatsBooked,
      booking.ride?.distance || 0,
      booking.ride?.vehicleType || 'petrol'
    );

    // Verify wallet balance
    const passenger = await User.findById(req.user.id);
    if (passenger.walletBalance < fareDetails.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. You need ₹${fareDetails.totalAmount - passenger.walletBalance} more.`
      });
    }

    const driver = await User.findById(booking.driver._id);

    // Perform wallet deductions & credits safely
    const originalPassengerBalance = passenger.walletBalance;
    passenger.walletBalance -= fareDetails.totalAmount;
    await passenger.save({ validateBeforeSave: false });

    const originalDriverBalance = driver.walletBalance;
    driver.walletBalance += fareDetails.subtotal; // Driver earns the subtotal fare
    await driver.save({ validateBeforeSave: false });

    // Create wallet audit logs
    await WalletTransaction.create({
      user: passenger._id,
      type: 'RIDE_PAYMENT',
      amount: -fareDetails.totalAmount,
      balanceBefore: originalPassengerBalance,
      balanceAfter: passenger.walletBalance,
      referenceId: booking._id.toString(),
      description: `Ride payment to ${driver.name}`,
      status: 'success'
    });

    await WalletTransaction.create({
      user: driver._id,
      type: 'EARNINGS',
      amount: fareDetails.subtotal,
      balanceBefore: originalDriverBalance,
      balanceAfter: driver.walletBalance,
      referenceId: booking._id.toString(),
      description: `Ride earnings from ${passenger.name}`,
      status: 'success'
    });

    // Create payment entry
    const payment = await Payment.create({
      booking: bookingId,
      payer: req.user.id,
      payee: booking.driver._id,
      amount: fareDetails.totalAmount,
      status: 'captured',
      method: 'wallet',
      notes: 'Wallet ride booking payment'
    });

    // Update booking status
    booking.paymentStatus = 'paid';
    booking.paymentId = payment._id.toString();
    booking.totalAmount = fareDetails.totalAmount;
    booking.status = 'confirmed';
    await booking.save();

    // Notify driver
    await Notification.create({
      user: booking.driver._id,
      title: '💰 Payment Received (Wallet)',
      message: `Passenger paid ₹${fareDetails.totalAmount} using Wallet. You earned ₹${fareDetails.subtotal}.`,
      type: 'payment_success',
      data: { bookingId: booking._id, amount: fareDetails.totalAmount }
    });

    // Send confirmation email
    await sendBookingConfirmationEmail(booking.passenger, booking, booking.ride);

    res.status(200).json({
      success: true,
      message: '✅ Paid successfully with Wallet!',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initiate wallet top-up order
// @route   POST /api/payments/wallet/top-up
// @access  Private
exports.topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid top up amount' });
    }

    // Create Razorpay order specifically for wallet top-up
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `wallet_topup_${req.user.id}_${Date.now()}`,
      notes: {
        userId: req.user.id,
        type: 'wallet_topup'
      }
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify wallet top-up payment
// @route   POST /api/payments/wallet/verify-top-up
// @access  Private
exports.verifyWalletTopUp = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const user = await User.findById(req.user.id);
    const balanceBefore = user.walletBalance;
    user.walletBalance += parseFloat(amount);
    await user.save({ validateBeforeSave: false });

    // Record wallet transaction
    await WalletTransaction.create({
      user: req.user.id,
      type: 'TOP_UP',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter: user.walletBalance,
      referenceId: razorpay_payment_id,
      description: 'Wallet top up via Razorpay',
      status: 'success'
    });

    // Record payment
    await Payment.create({
      payer: req.user.id,
      payee: req.user.id, // self topup
      amount: parseFloat(amount),
      status: 'captured',
      method: 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature,
      notes: 'Wallet Top Up'
    });

    res.status(200).json({
      success: true,
      message: '💰 Wallet credited successfully!',
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user wallet balance and transactions
// @route   GET /api/payments/wallet
// @access  Private
exports.getWalletInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await WalletTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      walletBalance: user.walletBalance || 0,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};