const mongoose = require('mongoose');

const TaxonomySchema = new mongoose.Schema({
  translations: [
    {
      language: { type: String, default: 'fr' },
      designation: { type: String },
      description: { type: String }
    }
  ],
  logo: { type: String },
  image: { type: String },
  domain: { type: mongoose.Schema.Types.Mixed },
  children: [mongoose.Schema.Types.Mixed]
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('Taxonomy', TaxonomySchema);
