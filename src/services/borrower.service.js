import borrowerModel from '../database/models/borrower/borrower.models.js';
import relativesModels from '../database/models/borrower/relatives.models.js';
import workModels from '../database/models/borrower/work.models.js';
import usersModel from '../database/models/users.model.js';
import loanModel from '../database/models/loan/loans.models.js';
import {
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
} from '../utils/errorHandler.js';
import { uploadFileToFirebase } from '../utils/firebase.js';
import createLoan from './loans/createLoan.js';
import LoanRepository from '../database/repository/loan.repository.js';
import paymentModels from '../database/models/loan/payment.models.js';

export default class BorrowerService {
    constructor() {
        this.borrowerModel = borrowerModel;
        this.relativesModel = relativesModels;
        this.workModel = workModels;
        this.userModel = usersModel;
        this.loanRepo = new LoanRepository();
        this.loanModel = loanModel;
        this.paymentModel = paymentModels;
    }

    async requestVerifyBorrower(userId, payload, files) {
        try {
            payload = await transformNestedObject(payload);

            const { personal, relativesContact } = payload;

            // it will throw an error if there is a missing field
            validateVerifyBorrowerRequest(payload, personal, relativesContact);

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

    async getBorrowerProfile(payload) {
        try {
            const errors = validateRequestPayload(payload, ['userId', 'roles']);
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            const { userId, roles } = payload;

            // Check if user is a borrower
            if (!roles.includes('borrower')) {
                throw new AuthorizeError('User is not a borrower!');
            }

            const [user, borrower] = await Promise.allSettled([
                await usersModel.findOne({ _id: userId }).select({
                    createdDate: 0,
                    modifyDate: 0,
                    __v: 0,
                    password: 0,
                    salt: 0,
                }),
                await borrowerModel
                    .findOne({ userId })
                    .select({ createdDate: 0, modifyDate: 0, __v: 0 }),
            ]);

            if (!user.value) {
                throw new NotFoundError('User not found!');
            }

            const work = await this.workModel.findOne({ userId }).select({
                userId: 0,
                __v: 0,
                createdDate: 0,
                modifyDate: 0,
                _id: 0,
            });

            // console.log('user', user);

            const profile = {
                ...user.value._doc,
                ...borrower.value._doc,
                work: work._doc,
            };

            delete profile['_id'];

            console.log('Borrower profile fetched!');

            return profile;
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
                borrowingCategory,
            } = payload;

            if (yieldReturn < 50000) {
                throw new RequestError('Minimum loan yield is 50000');
            }

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
                    loan.value.status === 'unpaid')
            ) {
                throw new ActiveLoanError('You already has an active loan!');
            }

            console.log('userId', user.userId);

            // const borrower = await this.borrowerModels.findOne({
            //     userId: user.userId,
            // });
            // console.log('borrower', borrower);
            // if (
            //     borrower.status === 'on request' ||
            //     borrower.status === 'in borrowing' ||
            //     borrower.status === 'unpaid' ||
            //     borrower.status === 'on process'
            // ) {
            //     throw new ActiveLoanError('You already has an active loan!');
            // }
            // *TODO - check if user loan limit is not exceeded

            const loanApplication = {
                purpose,
                amount,
                tenor,
                yieldReturn,
                paymentSchema,
                borrowingCategory,
            };

            const userData = {
                userId: user.userId,
                borrowerId: borrower.value._id,
            };
            return createLoan({ user: userData, loanApplication });
            // return { user: userData, loanApplication };
        } catch (error) {
            throw error;
        }
    }

    async getLoanHistory(userId, roles) {
        try {
            const loans = await this.loanRepo.getBorrowerLoanHistory(userId);
            // console.log('loans', loans);

            if (!loans) {
                return {
                    active: {},
                    history: [],
                };
            }

            if (loans.active.length < 1) {
                return {
                    active: {},
                    history: loans.history,
                };
            }

            // console.log('loans', JSON.stringify(loans, null, 4));
            return loans;
        } catch (error) {
            throw error;
        }
    }

    async getPaymentSchedule(userId) {
        try {
            const loans = await this.paymentModel.aggregate([
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
                                                            'repayment',
                                                            'late repayment',
                                                        ],
                                                    ],
                                                },
                                                {
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
                                // {
                                //     $arrayElemAt: [
                                //         {
                                //             $filter: {
                                //                 input: '$paymentSchedule',
                                //                 as: 'item',
                                //                 cond: {
                                //                     $eq: [
                                //                         '$$item.status',
                                //                         'unpaid',
                                //                     ],
                                //                 },
                                //             },
                                //         },
                                //         0,
                                //     ],
                                // },
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
                                                                $eq: [
                                                                    '$$item.status',
                                                                    'unpaid',
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
                                {},
                            ],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        loan: 0,
                        loanId: 0,
                        userId: 0,
                        createdDate: 0,
                        modifyDate: 0,
                        __v: 0,
                    },
                },
            ]);

            // console.log('loans', loans);
            return loans[0];
        } catch (error) {
            throw error;
        }
    }
}
