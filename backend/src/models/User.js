// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  resetPasswordToken: { type: String, required: false },
  resetPasswordExpires: { type: Date, required: false },
}, { timestamps: true });

// Add indexes for frequently queried fields
// `email` already has `unique: true` on the schema path above —
// avoid re-declaring the same index which causes duplicate index warnings.
// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ resetPasswordToken: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema); 