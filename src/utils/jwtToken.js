import jwt from 'jsonwebtoken';
import RefreshToken from '../database/models/refreshToken.model.js';
import config from '../config/index.js';
import { AuthorizeError } from './errorHandler.js';
import borrowerModels from '../database/models/borrower/borrower.models.js';
import lenderModel from '../database/models/lender/lender.model.js';

export const generateTokens = async (user) => {
    try {
        let verifiedKYC = false;

        if (user.roles.toLowerCase() == 'lender') {
            const lender = await lenderModel.findOne({ userId: user._id });
            verifiedKYC = lender.roles;
        } else if (user.roles.toLowerCase() == 'borrower') {
            const borrower = await borrowerModels.findOne({ userId: user._id });
            verifiedKYC = borrower.roles;
        }

        const payload = {
            userId: user._id.toString(),
            roles: user.roles,
            verifiedEmail: user.verified,
            verifiedKYC: verifiedKYC,
        };
        const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_PRIVATE_KEY, {
            expiresIn: config.tokenExpires.access,
        });
        const refreshToken = jwt.sign(
            payload,
            config.REFRESH_TOKEN_PRIVATE_KEY,
            { expiresIn: config.tokenExpires.refresh },
        );

        const userToken = await RefreshToken.findOne({ userId: user._id });
        if (userToken) await userToken.deleteOne({ userId: user._id });

        await new RefreshToken({
            userId: user._id,
            refresh_token: refreshToken,
        });
        return Promise.resolve({ accessToken, refreshToken });
    } catch (err) {
        return Promise.reject(err);
    }
};

export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.REFRESH_TOKEN_PRIVATE_KEY);
        return Promise.resolve(decoded);
    } catch (err) {
        return Promise.reject(new AuthorizeError(err.message));
    }
};

export const regenerateAccessToken = async (user) => {
    try {
        let verifiedKYC = false;

        if (user.roles.toLowerCase() == 'lender') {
            const lender = await lenderModel.findOne({ userId: user._id });
            verifiedKYC = lender.roles;
        } else if (user.roles.toLowerCase() == 'borrower') {
            const borrower = await borrowerModels.findOne({ userId: user._id });
            verifiedKYC = borrower.roles;
        }
        const payload = {
            userId: user._id.toString(),
            roles: user.roles,
            verifiedEmail: user.verified,
            verifiedKYC: verifiedKYC,
        };
        const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_PRIVATE_KEY, {
            expiresIn: config.tokenExpires.access,
        });

        return Promise.resolve(accessToken);
    } catch (err) {
        return Promise.reject(new AuthorizeError(err.message));
    }
};
