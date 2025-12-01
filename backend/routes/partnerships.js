const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Partnership = require('../models/Partnership');
const User = require('../models/User');
require('dotenv').config();

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Request partnership
router.post('/request', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(receiverId);
    
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
    if (sender._id.toString() === receiverId) return res.status(400).json({ error: 'Cannot partner with yourself' });
    
    // Check if partnership already exists
    const existing = await Partnership.findOne({
      $or: [
        { sender: sender._id, receiver: receiver._id },
        { sender: receiver._id, receiver: sender._id }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Partnership already exists', partnership: existing });
    }
    
    const partnership = await Partnership.create({
      sender: sender._id,
      receiver: receiver._id,
      status: 'pending'
    });
    
    res.json(await partnership.populate(['sender', 'receiver'], 'name companyName role email'));
  } catch (e) {
    console.error('Request partnership error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// Accept/reject partnership
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }
    
    const partnership = await Partnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ error: 'Partnership not found' });
    
    if (partnership.receiver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only receiver can respond' });
    }
    
    if (partnership.status !== 'pending') {
      return res.status(400).json({ error: 'Already responded' });
    }
    
    partnership.status = status;
    await partnership.save();
    
    res.json(await partnership.populate(['sender', 'receiver'], 'name companyName role email'));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// List partnerships
router.get('/list', auth, async (req, res) => {
  try {
    const partnerships = await Partnership.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    }).populate('sender receiver', 'name companyName role email').sort({ createdAt: -1 });
    
    res.json(partnerships);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// Get pending requests (where I'm the receiver)
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await Partnership.find({
      receiver: req.user.id,
      status: 'pending'
    }).populate('sender', 'name companyName role email').sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

module.exports = router;

