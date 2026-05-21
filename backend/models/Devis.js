const mongoose = require('mongoose');

const DevisSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  userName: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Devis', DevisSchema);
