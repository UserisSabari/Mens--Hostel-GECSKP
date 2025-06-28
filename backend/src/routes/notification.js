const express = require('express');
const Notification = require('../models/Notification');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Add a new notification (admin only)
console.log('Registering notification route: /');
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, message, pdfUrl, type } = req.body;
    if (!title || !pdfUrl) {
      return res.status(400).json({ message: 'Title and PDF link are required.' });
    }
    const notification = new Notification({ title, message, pdfUrl, type });
    await notification.save();
    res.status(201).json({ message: 'Notification added', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all notifications (public)
console.log('Registering notification route: / (GET)');
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a notification (admin only)
console.log('Registering notification route: /:id');
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 