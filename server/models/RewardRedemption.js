const mongoose = require('mongoose');

const rewardRedemptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: String, required: true },
  rewardName: { type: String, required: true },
  pointsCost: { type: Number, required: true },
  couponCode: { type: String, required: true },
  status: { type: String, enum: ['active', 'used', 'expired'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);
