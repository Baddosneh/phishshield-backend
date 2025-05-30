const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    gmailTokens: {
    type: Object, // or a more specific schema
    default: null
  },
    createdAt: {
        type: Date,
        default: Date.now
    },
    scanHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scan'
    }],
     resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    plan: { type: String, 
        default: null 
    },
    planStart: { type: Date, 
        default: null 
    },
    planEnd: { type: Date, 
        default: null 
    },
    freeEmailScans: { type: Number, 
        default: 5 
    },
    freeUrlScans: { type: Number, 
        default: 5 
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;