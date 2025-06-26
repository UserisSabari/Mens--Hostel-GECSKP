const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const attendanceRouter = require('./attendance'); // Assuming the router is in the same directory
const Attendance = require('../models/Attendance');

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    req.user = { userId: 'mock-user-id', role: 'student' };
    next();
  },
  adminOnly: (req, res, next) => next(),
}));

// Mock the Attendance model
jest.mock('../models/Attendance');

const app = express();
app.use(express.json());
app.use('/api/attendance', attendanceRouter);

describe('Attendance API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/attendance/month', () => {
    it('should return attendance data for a valid user and month', async () => {
      const mockAttendanceData = [
        { date: '2024-01-10', meals: { morning: true, noon: false, night: true } },
        { date: '2024-01-11', meals: { morning: false, noon: true, night: true } },
      ];
      
      Attendance.find.mockResolvedValue(mockAttendanceData);

      const response = await request(app)
        .get('/api/attendance/month?userId=mock-user-id&month=2024-01');
        
      expect(response.status).toBe(200);
      expect(response.body.attendance).toEqual(mockAttendanceData);
      expect(Attendance.find).toHaveBeenCalledWith({
        userId: 'mock-user-id',
        date: { $regex: new RegExp(`^2024-01-\\d{2}$`) },
      });
    });

    it('should return 400 if userId or month is missing', async () => {
      const response = await request(app).get('/api/attendance/month');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  // You can add more tests for other routes (e.g., POST /mark, GET /admin/summary) here
}); 