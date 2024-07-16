// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const jwtVerify = promisify(jwt.verify);

const auth = async (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = await jwtVerify(token, process.env.JWT_SECRET);
        req.user = decoded; // Assuming the token contains user information
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
