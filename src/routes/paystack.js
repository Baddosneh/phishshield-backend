const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const { body } = require('express-validator');


const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize a transaction
router.post('/initialize', 
   [
    body('amount').isNumeric().withMessage('Amount required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('plan').isString().notEmpty().withMessage('Plan required')
  ], authMiddleware, 
   async (req, res) => {
  try {
    const { amount, email, plan } = req.body;
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: Math.round(amount * 100), // Paystack expects amount in pesewas (GHS)
        email,
        currency: "GHS",
        callback_url: 'http://localhost:3000/dashboard?payment=success',
        metadata: {
          plan,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Paystack error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

module.exports = router;