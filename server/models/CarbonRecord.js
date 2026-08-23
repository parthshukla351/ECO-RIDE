const mongoose = require('mongoose');

const carbonRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  distance: { type: Number, required: true },
  emissionsAvoided: { type: Number, required: true },
  efficiencyScore: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('CarbonRecord', carbonRecordSchema);
