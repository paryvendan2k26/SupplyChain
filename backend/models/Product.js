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
    // NEW FIELDS (backward compatible)
    uniqueProductId: { type: String, index: true }, // MFR_{manufacturerId}_{timestamp}_{counter}
    requiresPartnership: { type: Boolean, default: false }, // Flag for new products requiring partnership
    currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Track current holder in DB
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Last sender
    qrVisible: { type: Boolean, default: true }, // Default true for backward compatibility
    qrAccessGrantedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users with QR access
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);


