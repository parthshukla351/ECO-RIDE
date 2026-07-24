const express = require('express');
const router = express.Router();
const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Carbon calculation
router.post('/carbon', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/calculate/carbon`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI service unavailable',
      error: error.message
    });
  }
});

// Pricing suggestion
router.post('/pricing', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict/pricing`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
});

// Demand prediction
router.post('/demand', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict/demand`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
});

// Ride matching
router.post('/match', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict/ride-match`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
});

// Safety score
router.post('/safety', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/score/safety`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
});

module.exports = router;