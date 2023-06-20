import fs from 'fs';
import nodemailer from 'nodemailer';
import mustache from 'mustache';
import config from '../../config/index.js';
import { ValidationError } from '../errorHandler.js';
import {
    addMinutesToDate,
    generateRandomCode,
    dateFormatter,
} from '../index.js';

/**
 *
 * @param {Object} data {recipient, subject, code}
 * @returns
 */
export const sendMail = async (data, template) => {
    // const { error } = validateSendEmail(data);
    if (!data.recipient) {
        throw new ValidationError('recipient email is required!');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.mail.user,
            pass: config.mail.password,
            clientId: config.mail.OAUTH_CLIENTID,
            clientSecret: config.mail.OAUTH_CLIENT_SECRET,
            refreshToken: config.mail.OAUTH_REFRESH_TOKEN,
        },
    });

    // const template = fs.readFileSync('./src/utils/mail/template.html', 'utf8');

    const mailOptions = {
        from: {
            name: 'P2P Lending Syariah',
            address: 'lendingsyariah@gmail.com',
        },
        to: data.recipient,
        subject: data.subject,
        html: mustache.render(template, { ...data }),
        // text: data.content,
    };
    transporter.sendMail(mailOptions);
    return true;
};

export const sendMailOTP = async (email, subject, template) => {
    const otp = generateRandomCode();

    const otpExpired = dateFormatter(
        addMinutesToDate(new Date(), config.OTP_EXPIRED),
    );
    // console.log('OTP', { otp, otpExpired });
    const dataMail = {
        recipient: email,
        // subject: `Verify Your Email [P2P Lending Syariah]`,
        subject,
        code: otp,
        otpExpired: new Date(otpExpired),
    };

    await sendMail(dataMail, template);
    // console.log('OTP 2', { otp, otpExpired });
    return { otp, otpExpired };
};

export const sendMailRequestNewPassword = async (email, subject, link) => {
    const dataMail = {
        recipient: email,
        // subject: `Verify Your Email [P2P Lending Syariah]`,
        subject,
        link,
    };

    const template = fs.readFileSync(
        './src/utils/mail/template/forgetPassword.html',
        'utf8',
    );

    await sendMail(dataMail, template);
    // console.log('MASOOKK');
    return true;
};

export const sendMailVerification = async (email, subject, link) => {
    const dataMail = {
        recipient: email,
        // subject: `Verify Your Email [P2P Lending Syariah]`,
        subject,
        link,
    };

    const template = fs.readFileSync(
        './src/utils/mail/template/verifyAccountLink.html',
        'utf8',
    );

    await sendMail(dataMail, template);
    console.log('MASOOKK');
    return true;
};
