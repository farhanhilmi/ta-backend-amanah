import Xendit from 'xendit-node';
import config from '../config/index.js';

const x = new Xendit({
    secretKey: config.XENDIT_SECRET_KEY,
});

const { VirtualAcc } = x;
const vaSpecificOptions = {};
const va = new VirtualAcc(vaSpecificOptions);

const { Disbursement } = x;
const disbursementSpecificOptions = {};
const d = new Disbursement(disbursementSpecificOptions);

export const createVA = async ({
    externalID,
    bankCode,
    name,
    isClosed = false,
}) => {
    try {
        const data = await va.createFixedVA({
            externalID,
            bankCode,
            name,
            isClosed,
        });
        return data;
    } catch (error) {
        throw error;
    }
};

export const sendMoney = async ({
    externalID,
    amount,
    bankCode,
    accountNumber,
}) => {
    try {
        const { id } = await d.create({
            externalID,
            amount,
            bankCode,
            accountNumber,
        });
        return id;
    } catch (error) {
        throw error;
    }
};
