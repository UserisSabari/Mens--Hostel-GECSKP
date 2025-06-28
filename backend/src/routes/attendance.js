const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();

// POST /api/attendance/mark
// Body: { userId, date (YYYY-MM-DD), meals: { morning, noon, night } }
router.post('/mark', async (req, res) => {
  try {
    const { userId, date, meals } = req.body;
    if (!userId || !date || !meals) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // --- Date Validation ---
    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);

    const deadline = new Date(requestedDate);
    deadline.setDate(requestedDate.getDate() - 1);
    deadline.setHours(19, 0, 0, 0); // Deadline is 7 PM the day before.

    const now = new Date();

    if (now > deadline) {
      return res.status(400).json({ message: `Deadline to mark for ${date} has passed.` });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    if (requestedDate > sevenDaysFromNow) {
      return res.status(400).json({ message: "Cannot mark attendance more than 7 days in advance." });
    }
    // --- End Validation ---

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
    let summary = { morning: 0, noon: 0, night: 0 };
    const details = users.map(user => {
      const att = attendanceMap[user._id.toString()];
      const morning = att ? !att.meals.morning : false;
      const noon = att ? !att.meals.noon : false;
      const night = att ? !att.meals.night : false;
      if (morning) summary.morning++;
      if (noon) summary.noon++;
      if (night) summary.night++;
      return {
        name: user.name,
        email: user.email,
        morning,
        noon,
        night
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