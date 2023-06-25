import lenderModel from '../database/models/lender/lender.model.js';
import loansModels from '../database/models/loan/loans.models.js';
import fundingModel from '../database/models/loan/funding.models.js';
import paymentModels from '../database/models/loan/payment.models.js';
import {
    AuthorizeError,
    DataConflictError,
    NotFoundError,
    RequestError,
    ValidationError,
} from '../utils/errorHandler.js';
import {
    checkInputTypeAutoLend,
    getCurrentJakartaTime,
    toObjectId,
    transformNestedObject,
    validateRequestPayload,
    validateVerifyLenderRequest,
} from '../utils/index.js';
import config from '../config/index.js';
import usersModel from '../database/models/users.model.js';
import workModels from '../database/models/borrower/work.models.js';
import { uploadFileToFirebase } from '../utils/firebase.js';
import autoLendModels from '../database/models/loan/autoLend.models.js';
import createAutoLend from './loans/createAutoLend.js';
import lenderContractModels from '../database/models/loan/lenderContract.models.js';
import lenderSignature from '../utils/lenderSignature.js';
import LenderRepository from '../database/repository/lender.repository.js';

export default class LenderService {
    constructor() {
        // this.portfolio = [];
        this.userModel = usersModel;
        this.lenderModel = lenderModel;
        this.loanModel = loansModels;
        this.fundingModel = fundingModel;
        this.paymentModel = paymentModels;
        this.workModel = workModels;
        this.autoLendModel = autoLendModels;
        this.lenderContract = lenderContractModels;
        this.lenderRepository = new LenderRepository();
    }

    async requestVerifyLender(userId, payload, files) {
        try {
            payload = await transformNestedObject(payload);
            // console.log('files', files);

            if (files.length < 2) {
                throw new ValidationError(
                    'idCardImage and faceImage must be provided!',
                );
            }

            // if (!payload.idCardImage || !payload.faceImage) {
            //     throw new ValidationError(
            //         'idCardImage and faceImage must be provided!',
            //     );
            // }

            // const user = await this.userModel.findOne({
            //     _id: toObjectId(userId),
            // });
            const lender = await this.lenderModel.findOne({ userId });

            if (!lender) {
                throw new NotFoundError('lender account not found!');
            }

            if (lender.status === 'verified') {
                throw new DataConflictError(
                    'Anda telah melakukan verifikasi KYC',
                );
            }

            if (lender.status === 'pending') {
                throw new DataConflictError(
                    'Anda sudah melakukan permintaan verifikasi KYC. Saat ini kami sedang melakukan pengecekan data KYC anda.',
                );
            }

            // if (!user.roles.includes('lender')) {
            //     throw new AuthorizeError('User is not a lender!');
            // }

            const { personal } = payload;

            // it will throw an error if there is a missing field
            validateVerifyLenderRequest(payload, personal);

            lender.status = 'pending';
            await Promise.allSettled([
                await lender.save(),
                await this.workModel.findOneAndUpdate(
                    { userId },
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
                const path = `lender/${category}/${userId}-${currentDate}`;
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
        } catch (error) {
            throw error;
        }
    }

    async getPortfolio(userId) {
        try {
            if (!userId) {
                throw new ValidationError('user Id is required!');
            }

            const result = await this.lenderRepository.getLenderPortfolio(
                userId,
            );
            console.log('result', JSON.stringify(result, null, 2));
            const formattedResult = {
                active: {
                    summary: {
                        totalFunding: 0,
                        totalYield: 0,
                    },
                    funding: [],
                },
                done: {
                    summary: {
                        totalFunding: 0,
                        totalYield: 0,
                    },
                    funding: [],
                },
            };
            return result[0] ? result[0] : formattedResult;
        } catch (error) {
            throw error;
        }
    }

    async getLenderProfile(userId) {
        try {
            if (!userId) {
                throw new ValidationError('user Id is required!');
            }

            const lender = await this.lenderModel
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
                            lenderId: '$_id',
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
                            userId: 0,
                            createdDate: 0,
                            modifyDate: 0,
                            status: 0,
                        },
                    },
                ])
                .exec();

            if (!lender[0]) {
                throw new NotFoundError('Lender not found!');
            }

            return lender[0];
        } catch (error) {
            throw error;
        }
    }

    async createFundings(user, payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'loanId',
                'amount',
            ]);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }

            if (user.roles !== 'lender') {
                throw new AuthorizeError(
                    'You are not authorized to perform this action!',
                );
            }
            const lender = await this.lenderModel.findOne({
                userId: user.userId,
            });
            if (lender.status !== 'verified') {
                throw new AuthorizeError(
                    'KYC Anda belum terverifikasi, harap verifikasi terlebih dahulu atau jika sudah melakukan verifikasi harap tunggu sementara kami sedang memverifikasi data Anda',
                );
            }

            const loan = await this.loanModel.findOne({
                _id: toObjectId(payload.loanId),
            });

            if (!loan) {
                throw new NotFoundError(
                    "We can't find the loan request you are looking for or the loan request is already funded by other lender",
                );
            }

            if (
                loan.status !== 'on request' &&
                loan.status !== 'on process'
                // loan.status !== 'in borrowing'
            ) {
                throw new ValidationError(
                    'The loan request is already funded by other lender',
                );
            }

            const funding = await this.fundingModel.findOne({
                userId: user.userId,
                loanId: payload.loanId,
            });
            if (funding) {
                throw new ValidationError(
                    'You already funded this loan request',
                );
            }

            const totalFunds = await this.fundingModel.aggregate([
                {
                    $match: {
                        loanId: toObjectId(payload.loanId),
                    },
                },
                {
                    $group: {
                        _id: '$loanId',
                        totalFunds: {
                            $sum: '$amount',
                        },
                    },
                },
            ]);
            let currentTotalFunds = !totalFunds[0]?.totalFunds
                ? 0
                : totalFunds[0]?.totalFunds;
            currentTotalFunds = currentTotalFunds + parseInt(payload.amount);
            console.log('currentTotalFunds', currentTotalFunds);
            // return;
            if (currentTotalFunds > loan.amount) {
                throw new RequestError(
                    "You can't fund more than the available loan amount.",
                );
            }

            // if (payload.amount > loan.amount) {
            //     throw RequestError('You cannot fund more than the loan amount');
            // }

            // const lender = await this.lenderModel.findOne({
            //     userId: user.userId,
            // });
            console.log('lender', lender);

            const yieldReturn =
                loan.yieldReturn * (payload.amount / loan.amount);

            const newFunding = await this.fundingModel.create({
                userId: user.userId,
                lenderId: lender._id,
                loanId: payload.loanId,
                amount: payload.amount,
                yield: yieldReturn,
            });
            console.log('newFunding', newFunding);

            if (!newFunding) {
                throw new RequestError(
                    'Failed to create funding, please try again later',
                );
            }

            if (currentTotalFunds === loan.amount) {
                loan.status = 'in borrowing';
                const paymentSchedule = [];
                const paymentDate = new Date(getCurrentJakartaTime());
                const totalBill =
                    loan.amount +
                    loan.yieldReturn +
                    parseInt(config.TAX_AMOUNT_APP);
                if (loan.paymentSchema === 'Pelunasan Cicilan') {
                    let paymentDateIncrement = 0;

                    const monthlyPayment = Math.floor(totalBill / loan.tenor); // Calculate the integer part of the monthly payment
                    const lastMonthPayment =
                        totalBill - monthlyPayment * (loan.tenor - 1); // Calculate the payment for the last month
                    for (let i = 0; i < loan.tenor - 1; i++) {
                        paymentDateIncrement += 30;
                        // const loanAmount =
                        //     (loan.amount + loan.yieldReturn) / loan.tenor;
                        paymentSchedule.push({
                            amount: monthlyPayment,
                            date: paymentDate.setDate(
                                paymentDate.getDate() + paymentDateIncrement,
                            ),
                        });
                    }
                    paymentSchedule.push({
                        amount: lastMonthPayment,
                        date: paymentDate.setDate(
                            paymentDate.getDate() + paymentDateIncrement + 30,
                        ),
                    });
                    // await this.paymentModel.create({
                    //     loanId: loan._id,
                    //     paymentSchedule,
                    // });
                } else {
                    paymentSchedule.push({
                        amount: totalBill,
                        date: paymentDate.setDate(
                            paymentDate.getDate() + loan.tenor * 30,
                        ),
                    });
                }
                await this.paymentModel.create({
                    loanId: loan._id,
                    paymentSchedule,
                });
            } else {
                loan.status = 'on process';
            }

            // Create signature for the loan lender
            const contractLink = await lenderSignature({
                loanId: loan._id.toString(),
                userId: user.userId,
                lenderId: lender._id.toString(),
                borrowerId: loan.borrowerId,
            });

            loan.save();
            return contractLink;
            // const loanthis.loanModel.findOneAndUpdate({_id: payload.loanId}, {status: 'in borrowing'})
        } catch (error) {
            throw error;
        }
    }

    async getLenderProfit(userId) {
        try {
            const fundings = await this.lenderModel.aggregate([
                {
                    $match: {
                        userId: toObjectId(userId),
                    },
                },
                {
                    $lookup: {
                        from: 'fundings',
                        localField: '_id',
                        foreignField: 'lenderId',
                        as: 'funding',
                    },
                },
                {
                    $unwind: '$funding',
                },
                {
                    $group: {
                        _id: null,
                        totalYield: {
                            $sum: '$funding.yield',
                        },
                        totalFunding: {
                            $sum: '$funding.amount',
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                    },
                },
            ]);

            // const lender = await this.lenderModel.aggregate([
            //     // match to get lender
            //     {
            //         $match: {
            //             userId: toObjectId(userId),
            //         },
            //     },
            //     {
            //         $lookup: {
            //             from: 'fundings',
            //             localField: '_id',
            //             foreignField: 'lenderId',
            //             as: 'funding',
            //         },
            //     },
            //     {
            //         $unwind: '$funding',
            //     },
            //     {
            //         $addFields: {},
            //     },
            //     // set project
            //     {
            //         $project: {
            //             _id: 0,
            //             userId: 0,
            //             __v: 0,
            //             createdDate: 0,
            //             modifyDate: 0,
            //             status: 0,
            //         },
            //     },

            //     // group by lender
            //     {
            //         $group: {
            //             _id: '$lender.loanId',
            //             totalYield: {
            //                 $sum: '$funding.yield',
            //             },
            //             totalFunding: {
            //                 $sum: '$funding.amount',
            //             },
            //         },
            //     },
            // ]);

            if (fundings.length === 0) {
                return {
                    totalYield: 0,
                    totalFunding: 0,
                };
            }

            return fundings[0];
        } catch (error) {
            throw error;
        }
    }

    async createAutoLend(userId, payload) {
        try {
            const {
                // successTransaction, // string of success transaction. e.g '2'
                tenorLength,
                borrowingCategory, // array of borrowing category e.g ['personal', 'business']
                yieldRange,
                amountToLend, // jumlah yang akan dipinjamkan. e.g '1000000'
                // cancelTime, // waktu untuk membatalkan auto lend. e.g 3 (3 days)
            } = payload;

            const errors = validateRequestPayload(payload, [
                'amountToLend',
                'tenorLength',
                'borrowingCategory',
                'yieldRange',
                // 'cancelTime',
            ]);

            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) are required!`);
            }
            checkInputTypeAutoLend(
                tenorLength,
                borrowingCategory,
                yieldRange,
                amountToLend,
                // cancelTime,
            );

            const autoLend = await this.autoLendModel.countDocuments({
                userId,
                // status done or active
                status: {
                    $in: ['waiting', 'matched'],
                },
            });
            if (autoLend > 0) {
                throw new DataConflictError('You already have auto lend in!');
            }
            createAutoLend({
                userId,
                tenorLength,
                borrowingCategory,
                yieldRange,
                amountToLend,
            });
            // return {
            //     userId,
            //     tenorLength,
            //     borrowingCategory,
            //     yieldRange,
            //     amountToLend,
            // };
        } catch (error) {
            throw error;
        }
    }
}
