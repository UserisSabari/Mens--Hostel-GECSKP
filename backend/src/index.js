// backend/src/index.js
// Basic Express server setup for Mess Management Web App

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

//console.log('MONGODB_URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (needed for Render deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Cookie parser middleware
app.use(cookieParser());

// CSRF protection (only for state-changing operations)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-side requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Enable cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes with the same options
app.options('*', cors(corsOptions));

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

// CSRF token endpoint (GET only, no CSRF protection needed)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Attendance routes
app.use('/api/attendance', require('./routes/attendance'));

// Mess Bill routes
app.use('/api/mess-bill', require('./routes/messBill'));

// Notifications routes
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
