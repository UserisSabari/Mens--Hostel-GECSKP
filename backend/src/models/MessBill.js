const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  previewUrl: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MessBill', messBillSchema); 