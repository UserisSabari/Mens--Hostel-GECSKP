// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 