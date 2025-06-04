const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { body } = require('express-validator');



router.post('/email',
    [body('input').isString().isLength({ min: 5 }).withMessage('Input is required')],
    scanController.scanEmail);


router.post('/url', 
    [body('input').isURL().withMessage('Valid URL required')],
    scanController.scanURL);

router.post('/sms',
    [body('input').isString().isLength({ min: 5 }).withMessage('Input is required')],
    scanController.scanSms
);    
module.exports = router;