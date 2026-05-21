const mongoose = require('mongoose');

const ForumSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  category: { type: String }
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('Forum', ForumSchema);
