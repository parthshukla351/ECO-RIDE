const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  version: { type: String, default: '1.0.0' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  permissions: [{ type: String }],
  capabilities: [{ type: String }],
  enabled: { type: Boolean, default: true },
  stats: {
    executionCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    avgLatency: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);
