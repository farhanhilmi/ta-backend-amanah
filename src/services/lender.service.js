import lenderModel from '../database/models/lender/lender.model.js';
import loansModels from '../database/models/loan/loans.models.js';
import fundingModel from '../database/models/loan/funding.models.js';
import {
    AuthorizeError,
    NotFoundError,
    RequestError,
    ValidationError,
} from '../utils/errorHandler.js';
import { toObjectId, validateRequestPayload } from '../utils/index.js';

export default class LenderService {
    constructor() {
        // this.portfolio = [];
        this.lenderModel = lenderModel;
        this.loanModel = loansModels;
        this.fundingModel = fundingModel;
    }

    async getLenderProfile(userId) {
        try {
            console.log('MASUK');
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

            const loan = await this.loanModel.findOne({
                _id: toObjectId(payload.loanId),
            });

            if (!loan) {
                throw new NotFoundError(
                    "We can't find the loan request you are looking for or the loan request is already funded by other lende",
                );
            }

            if (
                loan.status !== 'on request' &&
                loan.status !== 'on process' &&
                loan.status !== 'in borrowing'
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

            const lender = await this.lenderModel.findOne({
                userId: user.userId,
            });
            console.log('user.userId', user.userId);
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
        } catch (error) {
            throw error;
        }
    }

    async getLenderProfit(userId) {
        try {
            const lender = await this.lenderModel.aggregate([
                // match to get lender
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
                    $addFields: {},
                },
                // set project
                {
                    $project: {
                        _id: 0,
                        userId: 0,
                        __v: 0,
                        createdDate: 0,
                        modifyDate: 0,
                        status: 0,
                    },
                },

                // group by lender
                {
                    $group: {
                        _id: '$lender.loanId',
                        totalYield: {
                            $sum: '$funding.yield',
                        },
                        totalFunding: {
                            $sum: '$funding.amount',
                        },
                    },
                },
            ]);

            console.log('lender', lender);

            return lender;
        } catch (error) {
            throw error;
        }
    }

    async createAutoLend(userId, payload) {
        try {
        } catch (error) {
            throw error;
        }
    }
}
