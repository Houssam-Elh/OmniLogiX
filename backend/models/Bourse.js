const mongoose = require('mongoose');

const bourseSchema = new mongoose.Schema({
  category: String,
  title: String,
  origin: String,
  destination: String,
  cargo: String,
  date: String,
  price: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Bourse', bourseSchema);
