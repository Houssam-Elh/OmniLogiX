const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  typeProduit: String,
  marque: String,
  tarifUHTPardefaut: Number,
  image: String,
  category: String,
  description: String,
  translations: [
    {
      designationProduit: String,
      descriptifProduit: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
