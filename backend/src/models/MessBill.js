const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  previewUrl: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for frequently queried fields
messBillSchema.index({ year: -1, month: -1 });
messBillSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MessBill', messBillSchema); 