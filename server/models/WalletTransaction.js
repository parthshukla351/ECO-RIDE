const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['TOP_UP', 'RIDE_PAYMENT', 'REFUND', 'EARNINGS'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  referenceId: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  }
}, { timestamps: true });

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
