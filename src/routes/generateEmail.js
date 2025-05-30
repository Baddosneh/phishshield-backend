
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const authMiddleware = require('../middleware/auth'); // Adjust path as needed

// Flask backend URL (adjust as needed)

router.post('/generate_email', authMiddleware, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const flaskResponse = await fetch('http://localhost:5001/generate_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      return res.status(500).json({ error: 'Flask backend error', details: errorText });
    }

    const data = await flaskResponse.json();
    // Directly return the generated email result to the frontend
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

module.exports = router;
