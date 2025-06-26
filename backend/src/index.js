// backend/src/index.js
// Basic Express server setup for Mess Management Web App

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
//console.log('MONGODB_URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply to all API requests
app.use('/api', apiLimiter);

// Test route
app.get('/', (req, res) => {
  res.send('Mess Management API is running!');
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Attendance routes
app.use('/api/attendance', require('./routes/attendance'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
