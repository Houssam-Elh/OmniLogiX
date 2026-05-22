const mongoose = require('mongoose');

const devisSchema = new mongoose.Schema({
  productName: String,
  userName: String,
  company: String,
  email: String,
  phone: String,
  message: String,
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Devis', devisSchema);
