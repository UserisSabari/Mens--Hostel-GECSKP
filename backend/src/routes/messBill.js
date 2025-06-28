const express = require('express');
const MessBill = require('../models/MessBill');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Add a new mess bill (admin only)
console.log('Registering messBill route: /');
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { month, year, previewUrl, url } = req.body;
    if (!month || !year || !previewUrl || !url) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const bill = new MessBill({ month, year, previewUrl, url });
    await bill.save();
    res.status(201).json({ message: 'Mess bill added', bill });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all mess bills (public)
console.log('Registering messBill route: / (GET)');
router.get('/', async (req, res) => {
  try {
    const bills = await MessBill.find().sort({ year: -1, month: -1 });
    res.json({ bills });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a mess bill (admin only)
console.log('Registering messBill route: /:id');
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await MessBill.findByIdAndDelete(id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Mess bill deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 