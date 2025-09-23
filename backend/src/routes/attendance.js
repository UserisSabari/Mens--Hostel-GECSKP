const express = require('express');
const csrf = require('csurf');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const ExcelJS = require('exceljs');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

const router = express.Router();

// POST /api/attendance/mark
// Body: { date (YYYY-MM-DD), meals: { morning, noon, night } }
router.post('/mark', auth, csrfProtection, async (req, res) => {
  try {
    const { date, meals } = req.body;
    const userId = req.user.userId; // Get userId from authenticated user
    if (!date || !meals) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // --- Date Validation (strict YYYY-MM-DD) ---
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    // Use UTC midnight to avoid timezone shifts when converting dates
    const requestedDate = new Date(`${date}T00:00:00Z`);
    if (isNaN(requestedDate.getTime()) || requestedDate.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    // Deadline: 19:00 UTC on the day before the requested date
    const deadline = new Date(requestedDate);
    deadline.setUTCDate(requestedDate.getUTCDate() - 1);
    deadline.setUTCHours(19, 0, 0, 0);

    const now = new Date();
    if (now.getTime() > deadline.getTime()) {
      return res.status(400).json({ message: `Deadline to mark for ${date} has passed.` });
    }

    // Max 7 days in advance (based on UTC date)
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const sevenDaysFromNow = new Date(todayUTC);
    sevenDaysFromNow.setUTCDate(todayUTC.getUTCDate() + 7);
    if (requestedDate.getTime() > sevenDaysFromNow.getTime()) {
      return res.status(400).json({ message: 'Cannot mark attendance more than 7 days in advance.' });
    }

    // Upsert attendance (update if exists, insert if not)
    // Use $set and $setOnInsert to guarantee required fields are present on insert
    let attendance;
    try {
      attendance = await Attendance.findOneAndUpdate(
        { userId, date },
        { $set: { meals }, $setOnInsert: { userId, date } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      // Handle duplicate key race (two requests trying to insert simultaneously)
      if (err && err.code === 11000) {
        attendance = await Attendance.findOne({ userId, date });
      } else {
        throw err;
      }
    }
    return res.json({ message: 'Attendance marked', attendance });
  } catch (err) {
    console.error('Attendance mark error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/month?month=YYYY-MM
router.get('/month', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const userId = req.user.userId; // Get userId from authenticated user
    if (!month) {
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

// GET /api/attendance/admin/summary?date=YYYY-MM-DD
router.get('/admin/summary', auth, adminOnly, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });
    // Get all users (students only)
    const users = await User.find({ role: 'student' });
    // Get all attendance records for the date
    const attendanceRecords = await Attendance.find({ date });
    // Map userId to attendance
    const attendanceMap = {};
    attendanceRecords.forEach(a => { attendanceMap[a.userId.toString()] = a; });
    // Prepare details and summary
    // summary counts number of absentees per meal
    let summary = { morning: 0, noon: 0, night: 0 };
    const details = users.map(user => {
      const att = attendanceMap[user._id.toString()];
      // morning/noon/night are stored as boolean = present (true) by Attendance model
      // For clarity, compute explicit 'absent' flags. Keep the old keys (morning/noon/night)
      // as boolean absent for backward compatibility with the frontend.
      const morningAbsent = att ? !att.meals.morning : false;
      const noonAbsent = att ? !att.meals.noon : false;
      const nightAbsent = att ? !att.meals.night : false;
      if (morningAbsent) summary.morning++;
      if (noonAbsent) summary.noon++;
      if (nightAbsent) summary.night++;
      return {
        name: user.name,
        email: user.email,
        // existing shape used by frontend: morning=true indicates 'No' (absent)
        morning: morningAbsent,
        noon: noonAbsent,
        night: nightAbsent,
        // explicit, clearer fields for future use
        morningAbsent,
        noonAbsent,
        nightAbsent,
      };
    });
    res.json({ date, summary, details });
  } catch (err) {
    console.error('Admin summary error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/admin/monthly-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/admin/monthly-report', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    // Get all students
    const User = require('../models/User');
    const students = await User.find({ role: 'student' });
    // Get all attendance records in range
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });
    // Build summary and details
    const summary = [];
    const details = [];
    students.forEach(student => {
      const studentRecords = attendanceRecords.filter(a => a.userId.toString() === student._id.toString());
      // Count full mess cuts (all meals false)
      let totalCuts = 0;
      const cutDates = [];
      studentRecords.forEach(rec => {
        const { morning, noon, night } = rec.meals;
        if (!morning && !noon && !night) {
          totalCuts++;
          cutDates.push(rec.date);
        }
      });
      summary.push({ name: student.name, totalCuts });
      cutDates.forEach(date => {
        details.push({ name: student.name, date });
      });
    });
    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Total Mess Cuts', key: 'totalCuts', width: 20 },
    ];
    summary.forEach(row => summarySheet.addRow(row));
    // Details sheet
    const detailsSheet = workbook.addWorksheet('Details');
    detailsSheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Date', key: 'date', width: 20 },
    ];
    details.forEach(row => detailsSheet.addRow(row));
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=mess-cut-report-${startDate}_to_${endDate}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/attendance/admin/monthly-report
router.post('/admin/monthly-report', auth, adminOnly, async (req, res) => {
  try {
    const { dates } = req.body;
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Dates array is required' });
    }
    // Get all students
    const students = await User.find({ role: 'student' });
    // Get all attendance records for the given dates
    const attendanceRecords = await Attendance.find({ date: { $in: dates } });
    // Build summary and details
    const summary = [];
    const details = [];
    students.forEach(student => {
      const studentRecords = attendanceRecords.filter(a => a.userId.toString() === student._id.toString());
      // Count full mess cuts (all meals false)
      let totalCuts = 0;
      const cutDates = [];
      studentRecords.forEach(rec => {
        const { morning, noon, night } = rec.meals;
        if (!morning && !noon && !night) {
          totalCuts++;
          cutDates.push(rec.date);
        }
      });
      summary.push({ name: student.name, totalCuts });
      cutDates.forEach(date => {
        details.push({ name: student.name, date });
      });
    });
    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Total Mess Cuts', key: 'totalCuts', width: 20 },
    ];
    summary.forEach(row => summarySheet.addRow(row));
    // Details sheet
    const detailsSheet = workbook.addWorksheet('Details');
    detailsSheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Date', key: 'date', width: 20 },
    ];
    details.forEach(row => detailsSheet.addRow(row));
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=mess-cut-report-${dates[0]}_to_${dates[dates.length-1]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 