const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper to verify Paystack signature
function verifyPaystackSignature(req) {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return hash === req.headers['x-paystack-signature'];
}

const getPlanDuration = (plan) => {
  switch (plan) {
    case 'Weekly': return 7;
    case 'Monthly': return 30;
    case 'Yearly': return 365;
    default: return 0;
  }
};

// Use express.json with verify option to get raw body for signature verification
router.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

router.post('/paystack/webhook', async (req, res) => {
  // Signature verification
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest('hex');
  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const email = event.data.customer.email;
    const plan = event.data.metadata.plan;
    const user = await User.findOne({ email });
    if (user && plan) {
      const start = new Date();
      const end = new Date(start);
      end.setDate(start.getDate() + getPlanDuration(plan));
      user.plan = plan;
      user.planStart = start;
      user.planEnd = end;
      await user.save();
    }
  }
  res.sendStatus(200);
});

module.exports = router;