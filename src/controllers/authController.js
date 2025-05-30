const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');



// Register a new user
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

   try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        
        await newUser.save();

        // Create JWT token
        const token = jwt.sign(
            { _id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Return the user data (excluding the password)
        res.status(201).json({
            message: 'User created successfully',
            token, 
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                joinedAt: newUser.joinedAt,
            },
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};



// Login a user
exports.login = async (req, res) => {
    const { email, password } = req.body;

   try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT
        const token = jwt.sign(
                    { _id: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
        );
        res.json({ token, user: { id: user._id, email: user.email, username: user.username, } });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};


exports.me = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
};


exports.resetPasswordRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = require('crypto').randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();


    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
      }
    });

    const resetUrl = `https://phishshield-seven.vercel.app/reset-password?token=${resetToken}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Reset password request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required.' });
        }

        

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.warn('No user found for token or token expired:', token);
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new pass
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();


        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
