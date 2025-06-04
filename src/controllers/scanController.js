
const Scan = require('../models/Scan');
const { analyzeEmail, analyzeURL, analyzeText } = require('../utils/aiIntegration');
const User = require('../models/User');
const { validationResult } = require('express-validator');


exports.scanEmail = async (req, res) => {
  try {

    const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
      }
    const { input } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // If not premium, check free scans
    if (!user.plan) {
      if (user.freeEmailScans <= 0) {
        return res.status(403).json({ error: 'Free email scan limit reached. Please upgrade your plan.' });
      }
      user.freeEmailScans -= 1;
      await user.save();
    }

    const emailResult = await analyzeEmail(input);

    // Save the scan result to the database with correct schema fields
    const emailScan = new Scan({
      scanInput: input,
      scanType: 'email',
      results: emailResult,
      userId: req.user._id,
      createdAt: new Date()
    });
    await emailScan.save();

    return res.json({ ...emailResult, _id: emailScan._id, createdAt: emailScan.createdAt });
  } catch (err) {
    console.error('Email scan error:', err);
    res.status(500).json({ error: 'Email scan failed' });
  }
};

// POST /api/scan/url
exports.scanURL = async (req, res) => {
  try {

    const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
      }
    const { input } = req.body;

 const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (!user.plan) {
      if (user.freeUrlScans <= 0) {
        return res.status(403).json({ error: 'Free URL scan limit reached. Please upgrade your plan.' });
      }
      user.freeUrlScans -= 1;
      await user.save();
    }

    // Analyze the URL
    const urlResult = await analyzeURL(input);

    // Save the scan result to the database
    const urlScan = new Scan({
      scanInput: input,
      scanType: 'url',
      results: urlResult,
      userId: req.user._id,
      createdAt: new Date()
    });
    await urlScan.save();

    return res.json({ ...urlResult, _id: urlScan._id, createdAt: urlScan.createdAt });
  } catch (err) {
    console.error('URL scan error:', err);
    res.status(500).json({ error: 'URL scan failed' });
  }
};

exports.scanSms = async (req, res) => {
  try {

    const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
      }
    const { input } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // If not premium, check free scans
    if (!user.plan) {
      if (user.freeEmailScans <= 0) {
        return res.status(403).json({ error: 'Free sms scan limit reached. Please upgrade your plan.' });
      }
      user.freeEmailScans -= 1;
      await user.save();
    }

    const smsResult = await analyzeText(input);

    // Save the scan result to the database with correct schema fields
    const smsScan = new Scan({
      scanInput: input,
      scanType: 'sms',
      results: smsResult,
      userId: req.user._id,
      createdAt: new Date()
    });
    await smsScan.save();

    return res.json({ ...smsResult, _id: smsScan._id, createdAt: smsScan.createdAt });
  } catch (err) {
    console.error('sms scan error:', err);
    res.status(500).json({ error: 'sms scan failed' });
  }
};

