const mongoose = require('mongoose');

const ActorSchema = new mongoose.Schema({
  nom: { type: String },
  prenom: { type: String },
  email: { type: String },
  telephone: { type: String },
  typeActeur: { type: String },
  raisonSociale: { type: String },
  translations: [
    {
      language: { type: String, default: 'fr' },
      description: { type: String },
      biographie: { type: String }
    }
  ]
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('Actor', ActorSchema);
