import crypto from 'crypto';
import bcrypt from 'bcrypt';
import fs from 'fs';
import config from '../../config/index.js';
import verifyToken from '../../database/models/verifyToken.model.js';
import {
    sendMailLoanFunded,
    sendMailOTP,
    sendMailVerification,
} from '../../utils/mail/index.js';
import Users from '../../database/models/users.model.js';
import {
    DataConflictError,
    NotFoundError,
    ValidationError,
} from '../../utils/errorHandler.js';
import OTPRepository from '../../database/repository/otp.repository.js';

export const sendLoanFullyFunded = async (
    borrower,
    loan,
    dashboardLink,
    contractLink,
) => {
    await sendMailLoanFunded(borrower, loan, dashboardLink, contractLink);
};

export const resendVerifyAccount = async (userId) => {
    try {
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            // Yes, it's a valid ObjectId,
            throw new ValidationError(
                'userId is not valid!. Please check again',
            );
        }
        const user = await Users.findOne({ _id: userId });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.verified) {
            throw new DataConflictError('Your account has been verified.');
        }

        await sendVerifyAccount(user);
    } catch (error) {
        throw error;
    }
};

export const resendOTPLogin = async (email) => {
    try {
        if (!email) {
            throw new ValidationError('Email is required');
        }
        const user = await Users.findOne({ email });
        if (!user) {
            throw new NotFoundError("We can't find your account");
        }

        if (!user.verified) {
            throw new DataConflictError(
                'Your account is not verified. Please check your email to verify your account.',
            );
        }

        const otpExpired = await sendOTPLogin(user);

        return { userId: user._id, otpExpired };
    } catch (error) {
        throw error;
    }
};

export const sendVerifyAccount = async (user) => {
    const tokenVerify = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(
        tokenVerify,
        Number(config.SALT_VERIFICATION_EMAIL_TOKEN),
    );

    const subject = `Verify Your Email [P2P Lending Syariah]`;
    const link = `${config.CLIENT_REACT_APP_HOST}/authentication/verification/email/${user._id}/${tokenVerify}`;

    sendMailVerification(user.email, subject, link);

    const verify = await verifyToken.findOne({ userId: user._id });
    if (verify) {
        await verifyToken.findOneAndUpdate(
            { userId: user._id },
            { token: hash },
        );
    } else {
        await new verifyToken({
            userId: user._id,
            token: hash,
        }).save();
    }
};

export const sendOTPLogin = async (user) => {
    const otpRepo = new OTPRepository();
    const template = fs.readFileSync(
        './src/utils/mail/template/verifyOTP.html',
        'utf8',
    );
    const subject = `[P2P Lending Syariah] Login Verification Code`;
    const { otp, otpExpired } = await sendMailOTP(
        user.email,
        subject,
        template,
    );

    const dataOTP = await otpRepo.findOne({ userId: user._id });
    // console.log('dataOTP', dataOTP);
    if (!dataOTP) {
        console.log('create new otp');
        await otpRepo.create(user._id, otp, otpExpired);
    } else {
        await otpRepo.updateOTPByUserId(user._id, {
            otp,
            expired: otpExpired,
        });
    }

    return otpExpired;
};
