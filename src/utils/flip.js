import axios from 'axios';
import config from '../config/index.js';
import FormData from 'form-data';

const FLIP_API = 'https://bigflip.id/big_sandbox_api';

export const createDisbursement = async (data) => {
    try {
        const payload = new FormData();
        payload.append('bank_code', data.bank_code);
        payload.append('account_number', data.account_number);
        payload.append('amount', data.amount);
        payload.append('remark', data.remark);
        const result = await axios.post(
            `${FLIP_API}/v3/disbursement`,
            payload,
            {
                headers: {
                    Authorization: `Basic ${config.FLIP_BASIC_AUTH}`,
                    'Content-Type': 'multipart/form-data',
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                    'idempotency-key': data.idempotency_key,
                    Accept: '*/*',
                },
            },
        );
        // console.log('result', result.data);
        return result.data;
    } catch (error) {
        // console.log('error', error);
        throw error;
    }
};

export const inquiryBankAccount = async (data) => {
    try {
        const payload = new FormData();
        payload.append('bank_code', data.bank_code);
        payload.append('account_number', data.account_number);
        payload.append('inquiry_key', data.inquiry_key);
        const result = await axios.post(
            `${FLIP_API}/v2/disbursement/bank-account-inquiry`,
            payload,
            {
                headers: {
                    Authorization: `Basic ${config.FLIP_BASIC_AUTH}`,
                    'Content-Type': 'multipart/form-data',
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                    'idempotency-key': '1',
                    Accept: '*/*',
                },
            },
        );
        console.log('result', result.data);
    } catch (error) {
        throw error;
    }
};

export const getBankInfo = async () => {
    try {
        const result = await axios.get(`${FLIP_API}/v2/general/banks`, {
            headers: {
                Authorization: `Basic ${config.FLIP_BASIC_AUTH}`,
            },
        });
        return result.data;
    } catch (error) {
        throw error;
    }
};

export const createPaymentIn = async ({
    title,
    type = 'SINGLE',
    amount,
    senderName,
    senderEmail,
    senderPhoneNumber,
    senderAddress,
    isWebsite = false,
    // senderBank,
    // senderBankType,
    step = 2,
}) => {
    try {
        const data = {
            title,
            type,
            amount,
            is_address_required: 1,
            is_phone_number_required: 1,
            step,
            sender_name: senderName,
            sender_email: senderEmail,
            sender_phone_number: senderPhoneNumber,
            sender_address: senderAddress,
        };
        console.log('data masuk', data);
        if (isWebsite === true) {
            data.redirect_url = 'https://amanahsyariah.vercel.app/lender';
        }
        const result = await axios.post(`${FLIP_API}/v2/pwf/bill`, data, {
            headers: {
                Authorization: `Basic ${config.FLIP_BASIC_AUTH}`,
                // 'Content-Type': 'multipart/form-data',
                'Content-Type': 'application/x-www-form-urlencoded',
                // 'idempotency-key': '1',
                Accept: '*/*',
            },
        });
        console.log('result', result.data);
        return {
            paymentLink: result.data.link_url,
        };
    } catch (error) {
        console.log('ERRRO FLIP: ', error.response);
        throw error;
    }
};
