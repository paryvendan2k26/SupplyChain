const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: Number, required: true, unique: true, index: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadataURI: { type: String },
    nftTokenId: { type: Number, unique: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);

