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

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : [];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // if you use cookies/auth
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

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
console.log('Registering route: /');
app.get('/', (req, res) => {
  res.send('Mess Management API is running!');
});

// Auth routes
console.log('Registering route: /api/auth');
app.use('/api/auth', require('./routes/auth'));

// Attendance routes
console.log('Registering route: /api/attendance');
app.use('/api/attendance', require('./routes/attendance'));

// Mess Bill routes
console.log('Registering route: /api/mess-bill');
app.use('/api/mess-bill', require('./routes/messBill'));

// Notifications routes
console.log('Registering route: /api/notifications');
app.use('/api/notifications', require('./routes/notification'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {

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

// Global error handler for CORS errors
app.use(function(err, req, res, next) {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS error: Not allowed by CORS' });
  }
  next(err);
});
