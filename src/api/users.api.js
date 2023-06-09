import UserService from '../services/users.service.js';
import changePassword from '../services/users/changePassword.js';
import {
    resendOTPLogin,
    resendVerifyAccount,
} from '../services/mail/sendMail.js';

// import userServices from '../services/index.js';
export class UsersController {
    constructor(channel) {
        this.channel = channel;
        this.usersService = new UserService();
    }

    async register(req, res, next) {
        try {
            const data = await this.usersService.createUser(req.body);
            // const data = await this.usersService.createAccount(req.body);
            res.status(201).json({
                status: true,
                message:
                    'We have sent you an email verification link. Please check your email to verify your account.',
                data,
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async resendVerifyAccount(req, res, next) {
        try {
            const { userId } = req.params;
            const data = await resendVerifyAccount(userId);
            // const data = await this.usersService.createAccount(req.body);
            res.status(200).json({
                status: true,
                message:
                    'We have sent you an email verification link. Please check your email to verify your account.',
                data,
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmailAccount(req, res, next) {
        try {
            const { userId, token } = req.params;
            await this.usersService.verifyEmail(userId, token);

            res.status(200).json({
                status: true,
                message: 'Your account has been successfully verified.',
                data: [],
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        const { action } = req.query;
        try {
            const data = await this.usersService.login(req.body, action);
            res.status(200).json({
                status: true,
                message: data.message,
                data: data.data,
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async resendOTPLogin(req, res, next) {
        const { email } = req.body;
        try {
            const data = await resendOTPLogin(email);
            res.status(200).json({
                status: true,
                message: 'OTP has been sent to your email',
                data,
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const data = await this.usersService.refreshToken({
                token: req.body.refreshToken,
            });
            res.status(200).json({
                status: true,
                message: 'success generate new access token',
                data,
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async requestForgetPassword(req, res, next) {
        try {
            await this.usersService.forgetPassword({
                email: req.body.email,
                platform: req.body.platform,
            });
            res.status(200).json({
                status: true,
                message:
                    'Your request has been processed. Please check your email to reset password!',
                data: [],
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    async forgetNewPassword(req, res, next) {
        try {
            const data = await changePassword(req.body);
            res.status(200).json({
                status: true,
                message: 'success change password',
                data,
                meta: {},
            });
        } catch (error) {
            next(error);
        }
    }

    // async sendSmsOTP(req, res, next) {
    //     try {
    //         const data = await sendSms(req.body.phoneNumber);
    //         res.status(200).json({
    //             status: true,
    //             message: 'success sending sms verification code!',
    //             data,
    //         });
    //     } catch (error) {
    //         next(error);
    //     }
    // }
}
