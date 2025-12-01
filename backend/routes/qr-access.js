const router = require('express').Router();
const jwt = require('jsonwebtoken');
const QRAccessRequest = require('../models/QRAccessRequest');
const Product = require('../models/Product');
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

// Request QR access (retailer)
router.post('/request', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'retailer') return res.status(403).json({ error: 'Only retailers can request QR access' });
    
    const { batchId, manufacturerId } = req.body;
    const manufacturer = await User.findById(manufacturerId);
    if (!manufacturer || manufacturer.role !== 'manufacturer') {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    
    // Check if request already exists
    const existing = await QRAccessRequest.findOne({
      batchId,
      retailer: user._id,
      manufacturer: manufacturerId
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Request already exists', request: existing });
    }
    
    const request = await QRAccessRequest.create({
      batchId,
      retailer: user._id,
      manufacturer: manufacturerId,
      status: 'pending'
    });
    
    res.json(await request.populate(['retailer', 'manufacturer'], 'name companyName role'));
  } catch (e) {
    console.error('QR access request error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// Grant/reject QR access (manufacturer)
router.post('/:id/grant', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    
    const user = await User.findById(req.user.id);
    if (user.role !== 'manufacturer') return res.status(403).json({ error: 'Only manufacturers can grant access' });
    
    const request = await QRAccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (request.manufacturer.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not your request' });
    }
    
    request.status = status;
    await request.save();
    
    if (status === 'approved') {
      // Grant QR access to retailer for all products in this batch
      await Product.updateMany(
        { batchId: request.batchId, manufacturer: user._id },
        { 
          $addToSet: { qrAccessGrantedTo: request.retailer },
          qrVisible: true 
        }
      );
    }
    
    res.json(await request.populate(['retailer', 'manufacturer'], 'name companyName role'));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// Get QR access requests (manufacturer)
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'manufacturer') return res.status(403).json({ error: 'Forbidden' });
    
    const requests = await QRAccessRequest.find({
      manufacturer: user._id
    }).populate('retailer', 'name companyName role email').sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

module.exports = router;

