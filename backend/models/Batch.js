const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: Number, required: true, unique: true, index: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manufacturerBatchNumber: { type: Number, required: true }, // Manufacturer-specific batch number (1, 2, 3...)
    metadataURI: { type: String },
    nftTokenId: { type: Number, unique: true }, // Globally unique NFT token ID
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    quantity: { type: Number, default: 0 }, // Number of products in the batch
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);

