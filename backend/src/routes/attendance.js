const express = require('express');
const Attendance = require('../models/Attendance');

const router = express.Router();

// POST /api/attendance/mark
// Body: { userId, date (YYYY-MM-DD), meals: { morning, noon, night } }
router.post('/mark', async (req, res) => {
  try {
    const { userId, date, meals } = req.body;
    if (!userId || !date || !meals) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Upsert attendance (update if exists, insert if not)
    const attendance = await Attendance.findOneAndUpdate(
      { userId, date },
      { meals },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Attendance marked', attendance });
  } catch (err) {
    console.error('Attendance mark error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/month?userId=...&month=YYYY-MM
router.get('/month', async (req, res) => {
  try {
    const { userId, month } = req.query;
    if (!userId || !month) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Find all attendance records for the user in the given month
    const regex = new RegExp(`^${month}-\\d{2}$`); // Matches YYYY-MM-XX
    const attendance = await Attendance.find({ userId, date: { $regex: regex } });
    res.json({ attendance });
  } catch (err) {
    console.error('Attendance fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 