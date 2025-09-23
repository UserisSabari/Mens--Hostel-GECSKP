const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String },
  pdfUrl: { type: String, required: true },
  type: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for frequently queried fields
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 