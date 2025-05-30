const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const loginLimiter  = require('../middleware/ratelimiting');
const { body } = require('express-validator');


// Route for user registration
router.post('/register', 
    [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars')
  ], authController.register);

router.post('/login', 
    [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password required')
    ], authController.login);

router.get('/me', authMiddleware, authController.me);

router.post('/reset-password-request', 
      [body('email').isEmail().withMessage('Invalid email')],
      authController.resetPasswordRequest);

router.post('/reset-password', 
    [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 })
  ], authController.resetPassword);

module.exports = router;