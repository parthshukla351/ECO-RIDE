const mongoose = require('mongoose');

const agentExecutionSchema = new mongoose.Schema({
  agentId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestType: { type: String, required: true },
  status: { type: String, enum: ['success', 'failure'], required: true },
  confidence: { type: Number, default: 1.0 },
  latency: { type: Number, required: true },
  resultSummary: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AgentExecution', agentExecutionSchema);
