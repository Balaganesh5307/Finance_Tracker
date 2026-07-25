const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Check if user is suspended
        const user = await User.findById(decoded.id);
        if (user && user.suspended) {
            return res.status(403).json({ message: 'Your account has been suspended by the platform administrator.' });
        }

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
