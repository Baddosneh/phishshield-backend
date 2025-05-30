const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { body } = require('express-validator');


// Route to process email content
router.post('/email',
    [body('input').isString().isLength({ min: 5 }).withMessage('Input is required')],
    scanController.scanEmail);

// Route to analyze webpage safety
router.post('/url', 
    [body('input').isURL().withMessage('Valid URL required')],
    scanController.scanURL);

module.exports = router;