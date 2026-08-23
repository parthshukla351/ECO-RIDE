const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  keywords: [{
    type: String,
    lowercase: true
  }],
  relatedFeature: String
}, { timestamps: true });

faqSchema.index({ keywords: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
