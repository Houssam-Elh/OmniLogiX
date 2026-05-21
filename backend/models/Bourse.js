const mongoose = require('mongoose');

const BourseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  origin: { type: String },
  destination: { type: String },
  cargo: { type: String },
  date: { type: String },
  price: { type: String },
  active: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Bourse', BourseSchema);
