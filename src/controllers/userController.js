const Scan = require('../models/Scan');
const User = require('../models/User');

exports.getUserHistory = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User ID missing from request.' });
        }

        // Fetch all scans for this user
        const scanHistory = await Scan.find({ userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            userId,
            scanHistory,
            count: scanHistory.length
        });
    } catch (error) {
        console.error('Error fetching user scan history:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};