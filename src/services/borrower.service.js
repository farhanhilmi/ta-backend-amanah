import borrowerModel from '../database/models/borrower/borrower.models.js';
import relativesModels from '../database/models/borrower/relatives.models.js';
import workModels from '../database/models/borrower/work.models.js';
import usersModel from '../database/models/users.model.js';
import loanModel from '../database/models/loan/loans.models.js';
import {
    generateUUID,
    toObjectId,
    transformNestedObject,
    validateRequestPayload,
    validateVerifyBorrowerRequest,
} from '../utils/index.js';
import {
    ActiveLoanError,
    AuthorizeError,
    NotFoundError,
    RequestError,
    ValidationError,
    DataConflictError,
    InsufficientError,
} from '../utils/errorHandler.js';
import { uploadFileToFirebase } from '../utils/firebase.js';
import createLoan from './loans/createLoan.js';
import LoanRepository from '../database/repository/loan.repository.js';
import paymentModels from '../database/models/loan/payment.models.js';
import balanceModel from '../database/models/balance.model.js';
import transactionModels from '../database/models/transaction.models.js';
import { createDisbursement, createPaymentIn } from '../utils/flip.js';

export default class BorrowerService {
    constructor() {
        this.borrowerModel = borrowerModel;
        this.relativesModel = relativesModels;
        this.workModel = workModels;
        this.userModel = usersModel;
        this.loanRepo = new LoanRepository();
        this.loanModel = loanModel;
        this.paymentModel = paymentModels;
        this.balanceModel = balanceModel;
        this.transactionModel = transactionModels;
    }
    async getBorrowerProfile(userId) {
        try {
            if (!userId) {
                throw new ValidationError('user Id is required!');
            }

            const lender = await this.borrowerModel
                .aggregate([
                    {
                        $match: {
                            userId: toObjectId(userId),
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user',
                        },
                    },
                    {
                        $unwind: '$user',
                    },
                    {
                        $addFields: {
                            name: '$user.name',
                            email: '$user.email',
                            phoneNumber: '$user.phoneNumber',
                            verified: '$user.verified',
                        },
                    },
                    {
                        $project: {
                            user: 0,
                            __v: 0,
                            _id: 0,
                            createdDate: 0,
                            modifyDate: 0,
                            status: 0,
                        },
                    },
                ])
                .exec();

            if (!lender[0]) {
                throw new NotFoundError('Borrower not found!');
            }

            return lender[0];
        } catch (error) {
            throw error;
        }
    }

    async requestVerifyBorrower(userId, payload, files) {
        try {
            payload = await transformNestedObject(payload);

            const { personal, relativesContact } = payload;

            // it will throw an error if there is a missing field
            validateVerifyBorrowerRequest(payload, personal, relativesContact);

            if (
                !['Mortgage', 'Rent', 'Own'].includes(
                    personal.homeOwnershipType,
                )
            ) {
                throw new ValidationError(
                    'homeOwnershipType must be one of these values: Mortgage, Rent, Own',
                );
            }

            // if (
            //     !['Mortgage', 'Rent', 'Own'].includes(
            //         personal.homeOwnershipType,
            //     )
            // ) {
            //     throw new ValidationError(
            //         'homeOwnershipType must be one of these values: Mortgage, Rent, Own',
            //     );
            // }

            const user = await this.userModel.findOne({
                _id: toObjectId(userId),
            });
            const borrower = await this.borrowerModel.findOne({ userId });

            if (!borrower) {
                throw new NotFoundError('Borrower account not found!');
            }

            if (borrower.status === 'verified') {
                throw new DataConflictError(
                    'Anda telah melakukan verifikasi KYC',
                );
            }

            if (borrower.status === 'pending') {
                throw new DataConflictError(
                    'Anda sudah melakukan permintaan verifikasi KYC. Saat ini kami sedang melakukan pengecekan data KYC anda.',
                );
            }

            if (!user.roles.includes('borrower')) {
                throw new AuthorizeError('User is not a borrower!');
            }

            const relatives = {
                firstRelative: {
                    name: relativesContact.firstRelative.name,
                    relation: relativesContact.firstRelative.relation,
                    phoneNumber: relativesContact.firstRelative.phoneNumber,
                },
                secondRelative: {
                    name: relativesContact.secondRelative.name,
                    relation: relativesContact.secondRelative.relation,
                    phoneNumber: relativesContact.secondRelative.phoneNumber,
                },
            };

            await Promise.allSettled([
                // await borrower.updateOne({ status: 'pending' }),

                await this.relativesModel.findOneAndUpdate(
                    { userId },
                    {
                        firstRelative: relatives.firstRelative,
                        secondRelative: relatives.secondRelative,
                    },
                ),
                await this.workModel.findOneAndUpdate(
                    { userId: userId },
                    {
                        salary: personal.work.salary,
                        position: personal.work.name,
                        annualIncome: personal.work.annualIncome,
                    },
                ),
                await this.borrowerModel.findOneAndUpdate(
                    { userId: userId },
                    {
                        noDependants: personal.noDependants,
                        totalMonthlyDebt: personal.work.totalMonthlyDebt,
                        homeOwnershipType: personal.homeOwnershipType,
                    },
                ),
            ]);

            const currentDate = Date.now();
            const fileUrls = await files.reduce(async (accPromise, file) => {
                const acc = await accPromise;
                const category = file.fieldname;
                console.log('file upload:', file);
                const path = `borrower/${category}/${userId}-${currentDate}`;
                const url = await uploadFileToFirebase(file, path);
                acc[category] = url;
                return acc;
            }, {});

            await this.userModel.findOneAndUpdate(
                { _id: toObjectId(userId) },
                {
                    $set: {
                        faceImage: fileUrls.faceImage,
                        idCardImage: fileUrls.idCardImage,
                        gender: personal.gender,
                        birthDate: personal.birthDate,
                        idCardNumber: personal.idCardNumber,
                    },
                },
            );
            borrower.status = 'pending';
            await borrower.save();
        } catch (error) {
            throw error;
        }
    }

    async requestLoan(user, payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'purpose',
                'amount',
                'tenor',
                'yieldReturn',
                'paymentSchema',
                'productLink',
                'borrowingCategory',
            ]);
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const {
                purpose,
                amount,
                tenor,
                yieldReturn,
                paymentSchema,
                productLink,
                borrowingCategory,
            } = payload;

            // if (yieldReturn < 50000) {
            //     throw new RequestError('Minimum loan yield is 50000');
            // }

            // * - Check if user is a borrower
            if (!user.roles.includes('borrower')) {
                throw new AuthorizeError('User is not a borrower!');
            }

            // check payment schema value is valid
            if (
                paymentSchema !== 'Pelunasan Cicilan' &&
                paymentSchema !== 'Pelunasan Langsung'
            ) {
                throw new RequestError(
                    'Payment schema must be Pelunasan Cicilan or Pelunasan Langsung',
                );
            }

            if (
                ![
                    'Bisnis Kecil',
                    'Tempat Tinggal',
                    'Kesehatan',
                    'Kendaraan',
                    'Pembelian Besar',
                ].includes(borrowingCategory)
            ) {
                throw new ValidationError(
                    'borrowingCategory must be one of these values: Bisnis Kecil, Tempat Tinggal, Kesehatan, Kendaraan, Pembelian Besar',
                );
            }

            // * - check if user already has an active loan
            const [loan, borrower] = await Promise.allSettled([
                this.loanModel.findOne({
                    userId: toObjectId(user.userId),
                }),
                this.borrowerModel.findOne({ userId: user.userId }),
            ]);
            // console.log('borrower', borrower.value);
            if (!borrower.value) {
                throw new NotFoundError('Borrower not found!');
            }
            if (borrower.value.status !== 'verified') {
                throw new AuthorizeError(
                    'KYC Anda belum terverifikasi, harap verifikasi terlebih dahulu atau jika sudah melakukan verifikasi harap tunggu sementara kami sedang memverifikasi data Anda',
                );
            }

            if (
                loan.value &&
                (loan.value.status === 'on request' ||
                    loan.value.status === 'in borrowing' ||
                    loan.value.status === 'on process' ||
                    loan.value.status === 'disbursement' ||
                    loan.value.status === 'unpaid')
            ) {
                throw new ActiveLoanError('You already has an active loan!');
            }

            // ? check if user loan limit is not exceeded
            if (parseInt(borrower.value.loanLimit) < parseInt(amount)) {
                throw new InsufficientError(
                    'Total pinjaman tidak boleh melebihi limit pinjaman anda.',
                );
            }

            console.log('userId', user.userId);

            const loanApplication = {
                purpose,
                amount,
                tenor,
                yieldReturn,
                paymentSchema,
                productLink,
                borrowingCategory,
            };

            const userData = {
                userId: user.userId,
                borrowerId: borrower.value._id,
            };
            return createLoan({ user: userData, loanApplication });
        } catch (error) {
            throw error;
        }
    }

    async getLoanHistory(userId, roles) {
        try {
            const loans = await this.loanRepo.getBorrowerLoanHistory(userId);

            if (!loans) {
                return {
                    active: {},
                    history: [],
                };
            }

            // console.log('loans', loans);

            // const loanHistory = loans.history.reduce((acc, loan) => {
            //     const loanId = loan.loanId.toString();
            //     if (!acc[loanId]) {
            //         acc[loanId] = loan;
            //     }
            //     return acc;
            // });

            const loanHistory = Object.values(
                loans.history.reduce((acc, loan) => {
                    const loanId = loan.loanId.toString();
                    if (!acc[loanId]) {
                        acc[loanId] = loan;
                    }
                    return acc;
                }, {}),
            );

            if (loans.active.length < 1) {
                // remove duplicate loan history

                return {
                    active: {},
                    history: loanHistory,
                };
            }

            // console.log(
            //     'loans',
            //     JSON.stringify(
            //         { active: loans.active, history: loanHistory },
            //         null,
            //         2,
            //     ),
            // );
            return { active: loans.active, history: loanHistory };
        } catch (error) {
            throw error;
        }
    }

    async getFundDisbursement(userId) {
        try {
            const loan = await this.loanModel.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                userId: toObjectId(userId),
                            },
                            {
                                status: 'in borrowing',
                            },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: 'transaction',
                        let: { loanId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    {
                                                        $arrayElemAt: [
                                                            {
                                                                $split: [
                                                                    '$transactionId',
                                                                    '-',
                                                                ],
                                                            },
                                                            0,
                                                        ],
                                                    },
                                                    {
                                                        $toString: '$$loanId',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                        as: 'transaction',
                    },
                },

                {
                    $addFields: {
                        loanId: '$_id',
                        status: {
                            $cond: {
                                if: { $eq: [{ $size: '$transaction' }, 0] },
                                then: 'Belum dicairkan',
                                else: {
                                    $arrayElemAt: ['$transaction.status', 0],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        userId: 0,
                        borrowerId: 0,
                        createdDate: 0,
                        modifyDate: 0,
                        purpose: 0,
                        borrowingCategory: 0,
                        transaction: 0,
                        __v: 0,
                    },
                },
            ]);
            return loan.length > 0 ? loan[0] : {};
        } catch (error) {
            throw error;
        }
    }

    async postFundDisbursement(userId, payload, files) {
        try {
            const errors = validateRequestPayload(payload, [
                'loanId',
                'bankCode',
                'account',
            ]);
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }
            console.log('files', files);
            if (files.length < 1) {
                throw new ValidationError('productPageImage must be provided!');
            }

            const loan = await this.loanModel.findOne({
                _id: payload.loanId,
            });
            if (!loan) {
                throw new NotFoundError('Loan not found!');
            }
            if (loan.status !== 'in borrowing') {
                throw new RequestError(
                    'Pinjaman anda belum bisa dicairkan saat ini dikarenakan total pinjaman belum terpenuhi atau sudah dicairkan sebelumnya. Jika terdapat kesalahan, mohon hubungi pihak Customer Service Amanah Syariah.',
                );
            }
            console.log('loan', loan);
            // const balance = await this.balanceModel.findOne(
            //     {
            //         userId: toObjectId(userId),
            //     },
            // );
            // const filteredBalance = balance?.account?.filter((item) =>
            //     item._id.equals(toObjectId(payload.bankId)),
            // );

            // if (filteredBalance.length < 1) {
            //     throw new NotFoundError('Bank account not found!');
            // }

            const transactionId = `${payload.loanId}-${generateUUID()}`;
            const data = {
                account_number: payload.account,
                bank_code: payload.bankCode,
                amount: loan.amount,
                remark: 'Disbursement',
                idempotency_key: transactionId,
            };

            const result = await createDisbursement(data);

            await this.transactionModel.create({
                transactionId,
                userId,
                type: 'Disbursement',
                amount: loan.amount,
                status: 'pending',
            });
            // const currentDate = Date.now();

            // const fileUrls = await uploadFileToFirebase(
            //     files[0].filename,
            //     `${files[0].productPageImage}/${userId}-${currentDate}`,
            // );
            // console.log('fileUrls', fileUrls);

            const currentDate = Date.now();
            const fileUrls = await files.reduce(async (accPromise, file) => {
                // const acc = await accPromise;
                const category = file.fieldname;
                console.log('file upload:', file);
                const path = `${category}/${userId}-${currentDate}`;
                const url = await uploadFileToFirebase(file, path);
                // acc[category] = url;
                return url;
            }, {});

            await this.paymentModel.findOneAndUpdate(
                {
                    loanId: payload.loanId,
                },
                {
                    $set: {
                        productPageImage: fileUrls,
                    },
                },
            );
            // loan.

            // console.log('balance', balance);
            // console.log('filteredBalance', filteredBalance);
            return true;
        } catch (error) {
            throw error;
        }
    }

    async postRepayment(userId, payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'loanId',
                'billId',
            ]);
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const [loan, user] = await Promise.allSettled([
                this.loanModel.findOne({ userId }),
                this.userModel.findOne({ _id: userId }),
            ]);

            if (!loan.value) {
                throw new NotFoundError('Loan not found!');
            }

            const transactionId = `${userId}-${generateUUID()}`;
            // console.log('transactionId', transactionId);

            const payment = await this.paymentModel.findOne(
                { loanId: payload.loanId },
                { paymentSchedule: 1, _id: 0 },
            );
            // console.log('payment', payment);

            const paymentSchedule = payment.paymentSchedule.filter(
                (item) => item._id.toString() === payload.billId,
            );

            // console.log('paymentSchedule', paymentSchedule);
            if (paymentSchedule.length < 1) {
                throw new NotFoundError(
                    'Kami tidak dapat menemukan tagihan anda.',
                );
            }
            // return;

            const { paymentLink } = await createPaymentIn({
                amount: paymentSchedule[0].amount,
                title: `Repayment #${transactionId}`,
                senderName: user.value.name,
                senderPhoneNumber: user.value.phoneNumber,
                senderEmail: user.value.email,
                senderAddress: 'Indonesia',
                isWebsite: payload.isWebsite,
            });

            // const billId = ''

            await this.transactionModel.create({
                userId: toObjectId(userId),
                amount: paymentSchedule[0].amount,
                transactionId,
                status: 'pending',
                type: 'Repayment',
                paymentLink,
                repaymentId: `${payload.loanId}-${payload.billId}`,
            });
            return { paymentLink };
        } catch (error) {
            throw error;
        }
    }

    async getPaymentSchedule(userId) {
        try {
            const loans = await this.paymentModel.aggregate([
                {
                    $match: {
                        status: 'disbursement',
                    },
                },
                {
                    $lookup: {
                        from: 'loans',
                        localField: 'loanId',
                        foreignField: '_id',
                        as: 'loan',
                    },
                },
                {
                    $unwind: '$loan',
                },
                {
                    $match: {
                        $and: [
                            {
                                'loan.userId': toObjectId(userId),
                            },
                            // { 'paymentSchedule.status': 'unpaid' },
                        ],
                    },
                },
                {
                    $addFields: {
                        // loanId: '$loan._id',
                        paymentSchedule: {
                            $filter: {
                                input: {
                                    $map: {
                                        input: '$paymentSchedule',
                                        as: 'item',
                                        in: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        '$$item.status',
                                                        [
                                                            'unpaid',
                                                            'repayment',
                                                            'late repayment',
                                                            'paid',
                                                            'late paid',
                                                        ],
                                                    ],
                                                },
                                                {
                                                    billId: '$$item._id',
                                                    amount: '$$item.amount',
                                                    status: '$$item.status',
                                                    date: {
                                                        $dateToString: {
                                                            date: '$$item.date',
                                                            timezone:
                                                                'Asia/Jakarta',
                                                            format: '%Y-%m-%d %H:%M',
                                                        },
                                                    },
                                                },
                                                null,
                                            ],
                                        },
                                    },
                                },
                                as: 'item',
                                cond: { $ne: ['$$item', null] },
                            },
                        },
                        currentMonth: {
                            $cond: [
                                {
                                    $anyElementTrue: {
                                        $map: {
                                            input: '$paymentSchedule',
                                            as: 'item',
                                            in: {
                                                $eq: [
                                                    '$$item.status',
                                                    'unpaid',
                                                ],
                                            },
                                        },
                                    },
                                },

                                {
                                    $let: {
                                        vars: {
                                            unpaidItem: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$paymentSchedule',
                                                            as: 'item',
                                                            cond: {
                                                                $and: [
                                                                    {
                                                                        $eq: [
                                                                            '$$item.status',
                                                                            'unpaid',
                                                                        ],
                                                                    },
                                                                    // {
                                                                    //     $gte: [
                                                                    //         new Date(),
                                                                    //         '$$item.date',
                                                                    //     ],
                                                                    // },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: '$$unpaidItem.amount',
                                    },
                                },
                                0,
                            ],
                        },
                    },
                },
                {
                    $sort: {
                        'paymentSchedule.date': 1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        loan: 0,
                        // loanId: 0,
                        userId: 0,
                        status: 0,
                        createdDate: 0,
                        modifyDate: 0,
                        __v: 0,
                    },
                },
            ]);

            // console.log('loans', loans);
            if (loans.length < 1) {
                return {
                    currentMonth: 0,
                    paymentSchedule: [],
                };
            }
            // let currentMonth = 0;
            const currentDate = new Date();
            // const currentMonth = currentDate.getMonth() + 1;

            // for
            const hasPaidInCurrentMonth = loans[0].paymentSchedule.some(
                (item) => {
                    const itemDate = new Date(item.date);
                    // const itemMonth = itemDate.getMonth() + 1; // Get the month of the item's date

                    return (
                        ['paid', 'late paid'].includes(item.status) &&
                        currentDate < itemDate
                    );
                },
            );

            const currentMonthAmount = hasPaidInCurrentMonth
                ? 0
                : loans[0].currentMonth;
            // console.log('currentMonth', currentMonthAmount);
            return { ...loans[0], currentMonth: currentMonthAmount };
        } catch (error) {
            throw error;
        }
    }
}
