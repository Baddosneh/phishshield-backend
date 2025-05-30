const cron = require('node-cron');
const User = require('../models/User');

cron.schedule('0 0 * * *', async () => {
  // Runs every day at midnight
  const now = new Date();
  await User.updateMany(
    { planEnd: { $lte: now }, plan: { $ne: null } },
    { $set: { plan: null, planStart: null, planEnd: null } }
  );
  console.log('Expired plans cancelled');
});