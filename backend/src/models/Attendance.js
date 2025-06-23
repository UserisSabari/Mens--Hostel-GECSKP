// backend/src/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  meals: {
    morning: { type: Boolean, default: true },
    noon: { type: Boolean, default: true },
    night: { type: Boolean, default: true },
  },
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // Prevent duplicate entries per user per day

module.exports = mongoose.model('Attendance', attendanceSchema); 