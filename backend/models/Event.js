const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String },
  date: { type: String },
  place: { type: String },
  description: { type: String }
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('Event', EventSchema);
