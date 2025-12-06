const mongoose = require('mongoose');

const globalCounterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    counter: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Static method to get and increment counter atomically
globalCounterSchema.statics.getNextCounter = async function(name) {
  const result = await this.findOneAndUpdate(
    { name },
    { $inc: { counter: 1 } },
    { upsert: true, new: true }
  );
  return result.counter;
};

module.exports = mongoose.model('GlobalCounter', globalCounterSchema);

