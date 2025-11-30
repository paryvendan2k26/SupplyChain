const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    blockchainId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }, // Reference to batch
    batchBlockchainId: { type: Number }, // On-chain batch ID
    sku: { type: String },
    imageUrl: { type: String },
    qrCodeUrl: { type: String },
    manufactureDate: { type: Date, required: true },
    zkProof: { type: mongoose.Schema.Types.Mixed }, // Store ZK proof if generated
    zkProofGenerated: { type: Boolean, default: false }, // Track if ZK proof is generated
    zkProofGeneratedAt: { type: Date }, // When ZK proof was generated
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);


