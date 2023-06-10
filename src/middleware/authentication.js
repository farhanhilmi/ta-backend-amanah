import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const authenticateToken = (req, res, next) => {
    const header = req.headers.authorization;
    const token = header && header.split(' ')[1];

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Token is required for authentication',
            data: [],
        });
    }

    try {
        const decoded = jwt.verify(token, config.ACCESS_TOKEN_PRIVATE_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid Token',
            data: [],
            // error: err.message,
        });
    }
    return next();
};

export default authenticateToken;
