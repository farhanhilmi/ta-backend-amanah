import balanceModel from '../database/models/balance.model.js';
import usersModel from '../database/models/users.model.js';
import {
    DataConflictError,
    InsufficientError,
    NotFoundError,
    RequestError,
    ValidationError,
} from '../utils/errorHandler.js';
import {
    generateUUID,
    isAccountIncluded,
    omit,
    toObjectId,
    validateRequestPayload,
} from '../utils/index.js';
// import {
//     createTransaction,
//     createTransactionCore,
//     validateBankAccount,
// } from '../utils/midtrans.js';
import transactionModels from '../database/models/transaction.models.js';
import {
    createDisbursement,
    createPaymentIn,
    getBankInfo,
} from '../utils/flip.js';
import {
    formatDataPagination,
    returnDataPagination,
} from '../utils/responses.js';

export default class BalanceService {
    constructor() {
        this.balanceModel = balanceModel;
        this.userModel = usersModel;
        this.transactionModel = transactionModels;
    }

    async getBalance(userId) {
        try {
            const user = await this.userModel.exists({ _id: userId });
            if (!user) {
                throw new NotFoundError('User not found');
            }
            const balance = await this.balanceModel.findOne({ userId });
            if (!balance) {
                throw new RequestError(
                    'We cannot fulfill your request, please try again later or contact our support',
                );
            }

            // const result = await createDisbursement({
            //     account_number: '1122333300',
            //     bank_code: 'bni',
            //     amount: '10000',
            //     remark: 'Withdraw',
            //     recipient_city: '391',
            //     beneficiary_email: 'mail@mail.com',
            // });
            // console.log('result', result);
            return { balance: balance.amount };
        } catch (error) {
            throw error;
        }
    }

    async getVirtualAccount(userId) {
        try {
            // const user = await this.userModel.exists({ _id: userId });
            // if (!user) {
            //     throw new NotFoundError('User not found');
            // }
            // const { virtualAccount } = await this.balanceModel.findOne(
            //     { userId },
            //     { virtualAccount: 1, _id: 0 },
            // );
            const va = [
                {
                    bankCode: 'bni',
                    nameName: 'Bank Negera Indonesia',
                },
                {
                    bankCode: 'bri',
                    nameName: 'Bank Rakyat Indonesia',
                },
                {
                    bankCode: 'bca',
                    nameName: 'Bank Central Asia',
                },
                {
                    bankCode: 'permata',
                    nameName: 'Bank Permata',
                },
                {
                    bankCode: 'mandiri',
                    nameName: 'Bank Mandiri',
                },
            ];
            return va;
        } catch (error) {
            throw error;
        }
    }

    // async

    async withdrawBalance(userId, payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'amount',
                'bankCode',
                'accountNumber',
            ]);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const balance = await this.balanceModel.findOne({ userId });
            if (balance.amount < payload.amount) {
                throw new InsufficientError(
                    'Your balance is not enough to withdraw.',
                );
            }

            // *TODO: check if bankCode and accountNumber is valid (payment gateway)
            const valid = true;

            if (!valid) {
                throw new NotFoundError(
                    "We can't find this account number. Please check again.",
                );
            }
            const transactionId = `${userId}-${generateUUID()}`;

            // *TODO: disburse to bank account (payment gateway)
            const data = {
                account_number: payload.accountNumber,
                bank_code: payload.bankCode,
                amount: payload.amount,
                remark: 'Withdraw',
                idempotency_key: transactionId,
            };
            const result = await createDisbursement(data);
            console.log('result', result);
            await this.transactionModel.create({
                transactionId,
                userId,
                type: 'Withdraw',
                amount: payload.amount,
                status: 'pending',
            });
            // const newBalance = balance.amount - payload.amount;

            return true;
        } catch (error) {
            throw error;
        }
    }

    async getTransactionHistory(userId, params) {
        try {
            let { page, limit, sort, order, type, status } = params;

            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            sort = sort || 'createdDate';
            order = order || 'desc';
            const sortOrder = order === 'asc' ? 1 : -1;

            let queryFilter = {};

            if (type) {
                queryFilter.type = { $regex: type, $options: 'i' };
            }
            if (status) {
                queryFilter.status = { $regex: status, $options: 'i' };
            }

            const user = await this.userModel.exists({ _id: userId });
            if (!user) {
                throw new NotFoundError('User not found');
            }
            const transactions = await this.transactionModel
                .aggregate(
                    [
                        {
                            $match: {
                                userId: toObjectId(userId),
                                ...queryFilter,
                            },
                        },
                        {
                            $project: {
                                transactionId: 1,
                                type: 1,
                                amount: 1,
                                status: 1,
                                paymentLink: 1,
                                _id: 0,
                                createdDate: 1,
                            },
                        },
                        {
                            $sort: { [sort]: sortOrder },
                        },
                        {
                            $skip: limit * page - limit,
                        },
                        {
                            $limit: limit,
                        },
                    ],

                    // {
                    //     transactionId: 1,
                    //     type: 1,
                    //     amount: 1,
                    //     status: 1,
                    //     _id: 0,
                    //     createdDate: 1,
                    // },
                )
                .exec();

            const totalItems = await this.transactionModel.countDocuments({
                userId: toObjectId(userId),
                ...queryFilter,
            });

            // return transactions;c
            console.log('transactions', transactions);
            return returnDataPagination(
                transactions,
                totalItems,
                {
                    ...params,
                },
                'balance/transaction/history',
            );
        } catch (error) {
            throw error;
        }
    }

    async getBankAccount(userId) {
        try {
            const user = await this.userModel.exists({ _id: userId });
            if (!user) {
                throw new NotFoundError('User not found');
            }
            const { account } = await this.balanceModel.findOne(
                { userId },
                { account: 1 },
            );
            return account;
            // return balance;
        } catch (error) {
            throw error;
        }
    }

    async validateBankAccount(payload) {
        try {
            console.log('payload', payload);
            const { number, bank } = payload;
            if (!number || !bank) {
                throw new ValidationError(
                    'Something wrong. Account number and bank are required!',
                );
            }

            // const account = await validateBankAccount(bank, number);
            // console.log('account', account);
            // return account;
        } catch (error) {
            throw error;
        }
    }

    async getAvailableBankInfo() {
        try {
            const banks = await getBankInfo();
            return banks;
        } catch (error) {
            throw error;
        }
    }

    async addBankAccount(userId, payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'accountNumber',
                'bankCode',
                'bankName',
            ]);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            // if (
            //     ![
            //         'bca',
            //         'bri',
            //         'bni',
            //         'cimb',
            //         'mandiri',
            //         'bsm',
            //         'muamalat',
            //     ].includes(payload.bankCode)
            // ) {
            //     throw new ValidationError(
            //         'Invalid bank code. Available bank code: bca, bri, bni, mandiri, cimb, bsm, muamalat',
            //     );
            // }

            const balance = await this.balanceModel.findOne(
                { userId },
                { account: 1 },
            );

            if (isAccountIncluded(balance.account, payload.accountNumber)) {
                throw new DataConflictError('Bank account already exist');
            }

            balance.account.push({
                accountNumber: payload.accountNumber,
                bankCode: payload.bankCode,
                bankName: payload.bankName,
            });
            await balance.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    async deleteBankAccount(userId, payload) {
        try {
            const errors = validateRequestPayload(payload, ['accountNumber']);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const balance = await this.balanceModel.findOne({ userId });
            // console.log(userId);
            if (!balance) {
                throw new NotFoundError('Bank account not found');
            }
            if (!isAccountIncluded(balance.account, payload.accountNumber)) {
                throw new NotFoundError('Bank account not found');
            }

            // console.log(balance);

            balance.account = balance.account.filter(
                (item) => item.accountNumber !== payload.accountNumber,
            );
            await balance.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    async updateBankAccount(userId, payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'accountNumber',
                'bankCode',
            ]);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const balance = await this.balanceModel.findOne(
                {
                    userId,
                    'account.accountNumber': payload.accountNumber,
                    'account.bankCode': payload.bankCode,
                },
                { account: 1 },
            );
            console.log('balance', balance);
            if (balance.length > 0) {
                throw new DataConflictError('Bank account already exist');
            }

            // *TODO: check if bankCode and accountNumber is valid (payment gateway)

            balance.account.accountNumber = payload.accountNumber;
            balance.account.bankCode = payload.bankCode;
            await balance.save();
            return true;
        } catch (error) {
            throw error;
        }
    }

    async topUpBalance(host, userId, payload) {
        try {
            console.log('host', host);
            // return;
            const errors = validateRequestPayload(payload, ['amount']);
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }
            // if (payload.type !== 'bank_transfer' && payload.type !== 'va') {
            //     throw new ValidationError(
            //         'Invalid type. Available type: bank_transfer, va',
            //     );
            // }
            // if (payload.type === 'va') {
            //     if (
            //         !['bca', 'bri', 'bni', 'permata', 'mandiri'].includes(
            //             payload.bankCode,
            //         )
            //     ) {
            //         throw new ValidationError(
            //             'Invalid bank code. Available bank code: bca, bri, bni, permata, mandiri',
            //         );
            //     }
            // }

            const transactionId = `${userId}-${generateUUID()}`;
            console.log('transactionId', transactionId);

            // const transaction = await createTransactionCore({
            //     amount: payload.amount,
            //     transactionId: transactionId,
            //     transactionType: 'bank_transfer',
            // });
            const user = await this.userModel.findOne({ _id: userId });
            const { paymentLink } = await createPaymentIn({
                amount: payload.amount,
                title: `Deposit #${transactionId}`,
                senderName: user.name,
                senderPhoneNumber: user.phoneNumber,
                senderEmail: user.email,
                senderAddress: 'Indonesia',
                isWebsite: payload.isWebsite,
            });

            await this.transactionModel.create({
                userId: toObjectId(userId),
                amount: payload.amount,
                transactionId,
                status: 'pending',
                type: 'Deposit',
                paymentLink,
            });
            return { paymentLink };
        } catch (error) {
            // Rollback any changes made in the database
            throw error;
        } finally {
        }
    }
}
