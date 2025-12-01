const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

// Ensure unique partnership between two users
partnershipSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model('Partnership', partnershipSchema);

