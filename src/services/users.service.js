import bcrypt from 'bcrypt';
import {
    hashPassword,
    validateRequestPayload,
    verifyPassword,
} from '../utils/index.js';
import {
    AuthorizeError,
    CredentialsError,
    DataConflictError,
    NotFoundError,
    RequestError,
    ValidationError,
} from '../utils/errorHandler.js';
import usersModel from '../database/models/users.model.js';
import UsersRepository from '../database/repository/users.repository.js';
import verifyToken from '../database/models/verifyToken.model.js';
import RefreshTokenRepository from '../database/repository/refreshToken.repository.js';
import config from '../config/index.js';
import { sendOTPLogin, sendVerifyAccount } from './mail/sendMail.js';
import verifyLoginOTP from './users/verifyLoginOTP.js';
import {
    generateTokens,
    regenerateAccessToken,
    verifyRefreshToken,
} from '../utils/jwtToken.js';
import forgetToken from '../database/models/forgetToken.model.js';
import { generateDynamicLink } from '../utils/firebase.js';
import { sendMailRequestNewPassword } from '../utils/mail/index.js';
import createBorrower from './users/createBorrower.js';
import createLender from './lender/createLender.js';
import checkKYCStatus from './users/checkKYCStatus.js';

export default class Users {
    constructor() {
        this.users = usersModel;
        this.usersRepo = new UsersRepository();
        this.verifyTokenModel = verifyToken;
        this.refreshTokenRepo = new RefreshTokenRepository();
        this.forgetTokenModel = forgetToken;
        this.lender;
    }

    async checkKYCStatus(userId, roles) {
        try {
            return await checkKYCStatus(userId, roles);
        } catch (error) {
            throw error;
        }
    }

    async createUser(payload) {
        try {
            const { name, email, password, roles, phoneNumber } = payload;

            const errors = validateRequestPayload(payload, [
                'name',
                'email',
                'password',
                'roles',
                'phoneNumber',
            ]);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const regex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/gm;

            const found = password.match(regex);

            if (!found) {
                throw new ValidationError(
                    'Password must be 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character',
                );
            }

            const [isUserExist, hashedPassword] = await Promise.allSettled([
                this.usersRepo.isUserExist(email),
                hashPassword(password),
            ]);

            if (isUserExist.value) {
                throw new DataConflictError(
                    'This e-mail address has already been registered',
                );
            }

            const salt = hashedPassword.value.split('.')[0];
            // console.log('connection', Object.getOwnPropertyNames(connection));

            const user = await this.usersRepo.createUser({
                name,
                email,
                roles,
                password: hashedPassword.value,
                verified: false,
                phoneNumber,
                salt,
            });
            console.log('user', user);

            // let otpExpiredTime;

            if (!user) {
                throw new RequestError(
                    'Failed to create new account. Please try again later',
                );
            }
            await sendVerifyAccount(user);
            delete Object.assign(user, { ['userId']: user['_id'] })['_id'];
            return user;
        } catch (error) {
            throw error;
        }
    }

    async verifyEmail(userId, token) {
        try {
            if (!userId || !token) {
                throw new RequestError('userId & token is required!');
            }
            if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
                // Yes, it's a valid ObjectId,
                throw new ValidationError(
                    'userId is not valid!. Please check again',
                );
            }

            const user = await this.usersRepo.findById(userId);
            if (!user) {
                throw new CredentialsError(
                    'Invalid or verification link is expired.',
                );
            }

            if (user.verified) {
                throw new DataConflictError('Your account already verified');
            }

            const verify = await this.verifyTokenModel.findOne({
                userId,
            });

            if (!verify) {
                throw new CredentialsError(
                    'Invalid or verification link is expired.',
                );
            }

            const isValid = await bcrypt.compare(token, verify.token);

            if (!isValid) {
                throw new CredentialsError(
                    'Invalid or verification link is expired.',
                );
            }

            const updatedUser = await this.usersRepo.updateVerifiedUser(
                userId,
                true,
            );
            if (!updatedUser) throw new NotFoundError('User not found');

            if (user.roles.toLowerCase() == 'borrower') createBorrower(userId);
            if (user.roles.toLowerCase() == 'lender') createLender(userId);

            await this.verifyTokenModel.deleteMany({ userId });

            return {
                email: updatedUser.email,
                userId: updatedUser._id,
                roles: updatedUser.roles,
            };
        } catch (error) {
            throw error;
        }
    }

    async login(payload, action = false) {
        try {
            if (action !== 'login') {
                if (
                    !Object.hasOwn(payload, 'email') ||
                    !Object.hasOwn(payload, 'password')
                ) {
                    throw new ValidationError(
                        'Body must be contain email and password',
                    );
                }
            } else {
                if (
                    !Object.hasOwn(payload, 'email') ||
                    !Object.hasOwn(payload, 'otp')
                ) {
                    throw new ValidationError(
                        'Body must be contain email and otp',
                    );
                }
            }

            const { email, password, otp } = payload;

            const requiredField = { email, password };
            const user = await this.usersRepo.findOne({ email }, { __v: 0 });

            if (!user)
                throw new NotFoundError(
                    'Your account is not registered. Please register your account first.',
                );

            // check if user has been verified and send verification email link
            if (!user.verified) {
                await sendVerifyAccount(user);
                throw new AuthorizeError(
                    'Your email is not verified!. We have sent you an email verification link. Please check your email to verify your account.',
                );
            }

            // execute this after user receive email OTP CODE
            if (action?.toLowerCase() === 'login') {
                // console.log('SUU MASOK');
                await verifyLoginOTP(otp, user._id);
                const { accessToken, refreshToken } = await generateTokens(
                    user,
                );
                await this.refreshTokenRepo.create(user._id, refreshToken);
                return {
                    data: { accessToken, refreshToken },
                    message: 'Login success',
                };
            }

            const errors = validateRequestPayload(requiredField, [
                'email',
                'password',
            ]);
            if (errors) {
                throw new ValidationError(
                    `${errorFields} field(s) is required!`,
                );
            }

            if (!(await verifyPassword(password, user.password, user.salt))) {
                throw new AuthorizeError('Password incorrect!');
            }

            if (action?.toLowerCase() === 'email-otp') {
                const otpExpired = await sendOTPLogin(user);
                return {
                    data: {
                        userId: user._id,
                        otpExpired,
                        email: user.email,
                    },
                    message: 'OTP has been sent to your email',
                };
            }
        } catch (error) {
            throw error;
        }
    }

    async refreshToken(payload) {
        try {
            const { token } = payload;
            if (!token) throw new ValidationError(`refresh_token is required!`);

            const refreshToken = await this.refreshTokenRepo.findOne({
                refreshToken: token,
            });
            if (!refreshToken)
                throw new NotFoundError('We cannot find your token!');

            const result = await verifyRefreshToken(token);

            const newAccessToken = await regenerateAccessToken({
                _id: result.userId,
                roles: result.roles,
            });

            return {
                accessToken: newAccessToken,
                refreshToken: refreshToken.refreshToken,
            };
        } catch (error) {
            throw error;
        }
    }

    async forgetPassword(payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'email',
                'platform',
            ]);
            const { email, platform } = payload;
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) is required!`);
            }

            platform = platform.toLowerCase();
            if (platform !== 'website' && platform !== 'mobile') {
                throw new ValidationError(
                    'Platform is invalid! Options available is "website" or "mobile"',
                );
            }

            const user = await this.usersRepo.findOne({ email });
            if (!user)
                throw new NotFoundError(
                    'We cannot find an account with that email',
                );

            const passToken = await this.forgetTokenModel.findOne({
                userId: user._id,
            });
            if (passToken) await passToken.deleteOne();

            let resetToken = crypto.randomBytes(32).toString('hex');
            const hash = await bcrypt.hash(
                resetToken,
                Number(config.SALT_FORGET_PASSWORD_TOKEN),
            );

            const forgetPass = await this.forgetTokenModel.findOne({
                userId: user._id,
            });
            if (forgetPass) {
                this.forgetTokenModel.findByIdAndUpdate(
                    { userId: user._id },
                    { token: hash },
                );
            } else {
                await new this.forgetTokenModel({
                    userId: user._id,
                    token: hash,
                }).save();
            }

            let link = `${config.CLIENT_REACT_APP_HOST}/reset-password/${resetToken}/${user._id}`;

            if (platform === 'mobile') {
                const dynamicLink = await generateDynamicLink(
                    resetToken,
                    user._id,
                );
                link = dynamicLink.shortLink;
            }

            const subject = 'Forget Password - Request new password';
            await sendMailRequestNewPassword(email, subject, link);

            return link;
        } catch (error) {
            throw error;
        }
    }
}
