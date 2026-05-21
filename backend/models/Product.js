const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // Essential fields for easy querying
  refProduit: { type: String },
  categorieProduit: { type: mongoose.Schema.Types.Mixed },
  marque: { type: String },
  tarifUHTPardefaut: { type: Number, default: 0 },
  translations: [
    {
      language: { type: String, default: 'fr' },
      designationProduit: { type: String },
      descriptifProduit: { type: String },
      slogan: { type: String },
      message: { type: String },
      tags: [String]
    }
  ],
  indicationDuStock: {
    refStockage: String,
    etatStock: String,
    indicationQuantiteDispo: Boolean,
    quantiteDisponible: Number,
    quantiteRestante: Number
  },
  imageProduit: { type: String },
  typeProduit: { type: String }
}, { 
  timestamps: true,
  strict: false // Allows other complex fields from package-models to be stored perfectly
});

module.exports = mongoose.model('Product', ProductSchema);
