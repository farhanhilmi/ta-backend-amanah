import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AuthorizeError } from '../utils/errorHandler.js';

export const authenticateToken = (req, res, next) => {
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

export const isLender = (req, res, next) => {
    const { roles } = req.user;

    if (roles.toLowerCase() != 'lender') {
        throw new AuthorizeError(
            'Your account has no access to these resources',
        );
    }
    return next();
};

export const isKYCVerified = (req, res, next) => {
    const { verifiedKYC } = req.user;

    if (verifiedKYC.toLowerCase() != 'verified') {
        throw new AuthorizeError(
            'KYC Anda belum terverifikasi, harap verifikasi terlebih dahulu atau jika sudah melakukan verifikasi harap tunggu sementara kami sedang memverifikasi data Anda',
        );
    }
    return next();
};

export const isBorrower = (req, res, next) => {
    const { roles } = req.user;

    if (roles.toLowerCase() != 'borrower') {
        throw new AuthorizeError(
            'Your account has no access to these resources',
        );
    }
    return next();
};
