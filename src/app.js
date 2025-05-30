const express = require('express');
require('dotenv').config();
const helmet = require('helmet');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const gmailRoutes = require('./routes/gmail');
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scanroute');
const historyRoutes = require('./routes/history');
const GenerateEmailRoutes = require('./routes/generateEmail');
const authMiddleware = require('./middleware/auth');
const paystackRoutes = require('./routes/paystack');
const rateLimit = require('express-rate-limit');
const paystackWebhook = require('./routes/paystackWebhook');

require('./utils/planSchedulers');

const cors = require('cors');



const app = express();

app.use('/api/paystack/webhook', paystackWebhook);


// Middleware
app.use(cors({
  origin: 'https://phishshield-seven.vercel.app',
}));
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);




mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth',  authRoutes);
app.use('/api/scan', authMiddleware, scanRoutes);
app.use('/api/history', authMiddleware,  historyRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/email',  GenerateEmailRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api', paystackWebhook);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});