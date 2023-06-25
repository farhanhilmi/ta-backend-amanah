import midtransClient from 'midtrans-client';
import config from '../config/index.js';
import transactionModels from '../database/models/transaction.models.js';
import { session } from '../database/connection.js';
import { toObjectId } from './index.js';
import balanceModel from '../database/models/balance.model.js';

// // Create Snap API instance, empty config
// let snap = new midtransClient.Snap();

// snap.apiConfig.isProduction = false;
// snap.apiConfig.serverKey = config.MIDTRANST_SERVER_KEY;
// snap.apiConfig.clientKey = config.MIDTRANST_CLIENT_KEY;

// Create Snap API instance
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: config.MIDTRANST_SERVER_KEY,
    clientKey: config.MIDTRANST_CLIENT_KEY,
});

// Create Core API instance
let core = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: config.MIDTRANST_SERVER_KEY,
    clientKey: config.MIDTRANST_CLIENT_KEY,
});

let iris = new midtransClient.Iris({
    isProduction: false,
    serverKey: config.MIDTRANST_SERVER_KEY,
    // clientKey: config.MIDTRANST_CLIENT_KEY,
});

export const transferToBank = async ({
    userName,
    bankCode,
    bankAccount,
    amount,
    notes,
}) => {
    try {
        const result = await iris.createPayouts([
            {
                beneficiary_name: userName,
                beneficiary_account: bankAccount,
                beneficiary_bank: bankCode,
                // beneficiary_email: 'beneficiary@example.com',
                amount: `${amount}`,
                notes,
            },
            // {
            //     beneficiary_name: 'John Doe',
            //     beneficiary_account: '112673910288',
            //     beneficiary_bank: 'mandiri',
            //     amount: '50000.00',
            //     notes: 'Payout May 17',
            // },
        ]);
        console.log('result', result);
    } catch (error) {
        throw error;
    }
};

export const validateBankAccount = async (bankCode, account) => {
    try {
        const result = await iris.validateBankAccount({
            bank: bankCode,
            account: account,
        });
        console.log('result', result);
    } catch (error) {
        throw error;
    }
};

export const createTransaction = async ({ transactionId, amount }) => {
    let parameter = {
        transaction_details: {
            order_id: transactionId,
            gross_amount: amount,
        },
    };
    const transaction = await snap.createTransaction(parameter);
    console.log('transaction', transaction);
};

export const notificationListener = async (req, res, next) => {
    try {
        session.startTransaction();

        const notification = await core.transaction.notification(req.body);
        console.log('notification', notification);

        if (notification.transaction_status === 'settlement') {
            const transaction = await transactionModels.findOne({
                orderId: notification.order_id,
            });
            transaction.status = 'settlement';
            transaction.transactionTime = notification.transaction_time;
            transaction.save();

            switch (transaction.type) {
                case 'Deposit':
                    await balanceModel.findOneAndUpdate(
                        { userId: notification.order_id.split('-')[0] },
                        {
                            $inc: {
                                amount: parseInt(notification.gross_amount),
                            },
                        },
                    );
                    break;
                case 'Withdraw':
                    await balanceModel.findOneAndUpdate(
                        { userId: notification.order_id.split('-')[0] },
                        {
                            $inc: {
                                amount: -parseInt(notification.gross_amount),
                            },
                        },
                    );
                    break;
                case 'Loan Repayment':
                    // await balanceModel.findOneAndUpdate(
                    //     { userId: notification.order_id.split('-')[0] },
                    //     {
                    //         $inc: {
                    //             amount: -parseInt(notification.gross_amount),
                    //         },
                    //     },
                    // );
                    break;
                case 'Fund Disbursement':
                    // await balanceModel.findOneAndUpdate(
                    //     { userId: notification.order_id.split('-')[0] },
                    //     {
                    //         $inc: {
                    //             amount: -parseInt(notification.gross_amount),
                    //         },
                    //     },
                    // );
                    break;
            }
            // if (transaction.type === 'Deposit') {
            //     await balanceModel.findOneAndUpdate(
            //         { userId: notification.order_id.split('-')[0] },
            //         { $inc: { amount: parseInt(notification.gross_amount) } },
            //     );
            // }
            // await transactionModels.findOneAndUpdate(
            //     { orderId: notification.order_id },
            //     {
            //         status: 'settlement',
            //         transactionTime: notification.transaction_time,
            //     },
            // );
        }

        res.status(200).json({ message: 'success' });
    } catch (error) {
        await session.abortTransaction();

        next(error);
    } finally {
        await session.endSession();
    }
};

export const createTransactionCore = async ({
    transactionId,
    amount,
    email = null,
    bank = 'bri',
    transactionType = 'Deposit',
}) => {
    let parameter = {
        payment_type: 'bank_transfer',
        transaction_details: {
            order_id: transactionId,
            gross_amount: amount,
        },
        item_details: [
            {
                id: transactionId,
                price: amount,
                quantity: 1,
                transactionType,
                name: transactionType,
            },
        ],
        bank_transfer: {
            bank,
        },
    };
    if (email) {
        parameter.customer_details = {
            email,
        };
    }
    const transaction = await core.charge(parameter);
    // transaction {
    //     status_code: '201',
    //     status_message: 'Success, Bank Transfer transaction is created',
    //     transaction_id: 'c0b1d262-b19b-4787-816b-f970581f9eff',
    //     order_id: '12345',
    //     merchant_id: 'G003381346',
    //     gross_amount: '10000.00',
    //     currency: 'IDR',
    //     payment_type: 'bank_transfer',
    //     transaction_time: '2023-06-22 21:39:29',
    //     transaction_status: 'pending',
    //     fraud_status: 'accept',
    //     va_numbers: [ { bank: 'bca', va_number: '81346725005' } ],
    //     expiry_time: '2023-06-23 21:39:29'
    //   }
    console.log('transaction', transaction);
    return {
        VA: transaction.va_numbers,
        transactionId: transaction.transaction_id,
    };
    // return transaction.;
};
