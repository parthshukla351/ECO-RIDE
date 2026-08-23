const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
