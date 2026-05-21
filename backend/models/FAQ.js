const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String },
  category: { type: String }
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('FAQ', FAQSchema);
