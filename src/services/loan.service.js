import LoanRepository from '../database/repository/loan.repository.js';
import loansModels from '../database/models/loan/loans.models.js';
// import fundingModels from '../database/models/loan/funding.models.js';
// import autoLendModels from '../database/models/loan/autoLend.models.js';
// import borrowerContractModels from '../database/models/loan/borrowerContract.models.js';
import {
    formatDataPagination,
    returnDataPagination,
} from '../utils/responses.js';
import { NotFoundError, ValidationError } from '../utils/errorHandler.js';
import fundingModels from '../database/models/loan/funding.models.js';
import { toObjectId } from '../utils/index.js';
import { isCached } from '../utils/redis.js';

class LoanService {
    constructor() {
        this.loanRepository = new LoanRepository();
        // this.fundingModel = fundingModels;
        // this.autoLend = autoLendModels;
        this.loansModels = loansModels;
        this.fundingModels = fundingModels;
        // this.borrowerContract = borrowerContractModels;
    }

    async showAvailableLoans(userId, params) {
        try {
            let {
                page,
                limit,
                sort,
                order,
                q,
                tenor_min,
                tenor_max,
                yield_min,
                yield_max,
            } = params;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            sort = sort || 'createdDate';
            order = order || 'asc';
            q = q?.trim();

            let queryFilter = [];
            let cacheKey = `availableLoans-${userId}-${page}-${limit}-${sort}-${order}`;

            if (tenor_min && tenor_max) {
                queryFilter.push({
                    tenor: {
                        $gte: parseInt(tenor_min),
                        $lte: parseInt(tenor_max),
                    },
                });
                cacheKey += `-[tenor_min:${tenor_min}-tenor_max:${tenor_max}]`;
            } else if (tenor_min) {
                queryFilter.push({ tenor: { $gte: parseInt(tenor_min) } });
                cacheKey += `-[tenor_min:${tenor_min}]`;
            } else if (tenor_max) {
                queryFilter.push({ tenor: { $lte: parseInt(tenor_max) } });
                cacheKey += `-[tenor_max:${tenor_max}]`;
            }

            if (yield_min && yield_max) {
                queryFilter.push({
                    yieldReturn: {
                        $gte: parseInt(yield_min),
                        $lte: parseInt(yield_max),
                    },
                });
                cacheKey += `-[yield_min:${yield_min}-yield_max:${yield_max}]`;
            } else if (yield_min) {
                queryFilter.push({
                    yieldReturn: { $gte: parseInt(yield_min) },
                });
                cacheKey += `-[yield_min:${yield_min}]`;
            } else if (yield_max) {
                queryFilter.push({
                    yieldReturn: { $lte: parseInt(yield_max) },
                });
                cacheKey += `-[yield_max:${yield_max}]`;
            }

            if (q) {
                queryFilter.push({ purpose: { $regex: q, $options: 'i' } });
                cacheKey += `-[query:${q.replace(/\s/g, '')}]`;
            }

            // const cachedItems = await isCached(cacheKey);
            // if (cachedItems) {
            //     return cachedItems;
            // }

            // const loansFunding = await this.fundingModels.find({userId, status: })
            // console.log('loansFunding',loansFunding)

            const [loans, totalItems] = await Promise.all([
                this.loanRepository.lookupFind(
                    { $and: queryFilter },
                    // { loanPurpose: q },
                    userId,
                    page,
                    limit,
                    sort,
                    order,
                ),
                this.loansModels
                    .aggregate([
                        {
                            $match: {
                                $and: [
                                    {
                                        $or: [
                                            { status: 'on request' },
                                            { status: 'on process' },
                                        ],
                                    },
                                    ...queryFilter,
                                ],
                            },
                        },
                        {
                            $lookup: {
                                from: 'fundings',
                                localField: '_id',
                                foreignField: 'loanId',
                                as: 'funding',
                            },
                        },
                        {
                            $match: {
                                funding: {
                                    $not: {
                                        $elemMatch: {
                                            userId: toObjectId(userId),
                                        },
                                    },
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                loanCount: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                loanCount: { $ifNull: ['$loanCount', 0] },
                            },
                        },
                    ])
                    .exec(),
            ]);
            const loanCount =
                totalItems.length < 1 ? 0 : totalItems[0].loanCount;

            return returnDataPagination(
                loans,
                loanCount,
                {
                    ...params,
                },
                'loans/available',
            );

            // return formatDataPagination(
            //     loans,
            //     page,
            //     limit,
            //     totalItems,
            //     sort,
            //     order,
            //     q,
            //     tenor_min,
            //     tenor_max,
            //     yield_min,
            //     yield_max,
            // );
        } catch (error) {
            throw error;
        }
    }

    async getLoanDetails(loanId) {
        try {
            if (!loanId) throw new ValidationError('loanId is required');
            const loan = await this.loanRepository.findLoanById(loanId);

            if (!loan) throw new NotFoundError('Loan not found');
            return loan;
        } catch (error) {
            throw error;
        }
    }

    async getLoanRecommendation(userId) {
        try {
            const fundings = await this.fundingModels
                .aggregate([
                    {
                        $match: {
                            userId: toObjectId(userId),
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
                        $addFields: {
                            borrowingCategory: '$loan.borrowingCategory',
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            loanId: 1,
                            borrowingCategory: 1,
                            // loan: 0,
                        },
                    },
                    // FIND MOST BORROWING CATEGORY
                    {
                        $group: {
                            _id: '$borrowingCategory',
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: {
                            count: -1,
                        },
                    },
                    {
                        $limit: 1,
                    },
                    // FIND LOAN WITH MOST BORROWING CATEGORY
                    {
                        $lookup: {
                            from: 'loans',
                            let: { borrowingCategory: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $in: [
                                                        '$status',
                                                        [
                                                            'on request',
                                                            'on process',
                                                        ],
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        '$borrowingCategory',
                                                        '$$borrowingCategory',
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'fundings',
                                        localField: '_id',
                                        foreignField: 'loanId',
                                        as: 'existingFunding',
                                    },
                                },

                                {
                                    $match: {
                                        existingFunding: { $eq: [] },
                                    },
                                },
                            ],
                            as: 'loans',
                        },
                    },

                    {
                        $project: {
                            loanId: 0,
                            borrowingCategory: 0,
                        },
                    },
                    {
                        $unwind: '$loans',
                    },
                    {
                        $replaceRoot: {
                            newRoot: '$loans',
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            let: { userId: '$userId' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$_id', '$$userId'],
                                        },
                                    },
                                },
                            ],
                            as: 'user',
                        },
                    },
                    {
                        $unwind: '$user',
                    },
                    {
                        $lookup: {
                            from: 'fundings',
                            localField: '_id',
                            foreignField: 'loanId',
                            as: 'funding',
                        },
                    },
                    {
                        $addFields: {
                            loanId: '$_id',
                            'borrower.borrowerId': '$user._id',
                            'borrower.name': '$user.name',
                            'borrower.email': '$user.email',
                            totalFunding: {
                                // check if funding is empty array, return 0, else return total funding
                                $cond: {
                                    if: { $eq: ['$funding', []] },
                                    then: 0,
                                    else: {
                                        $toInt: {
                                            $sum: '$funding.amount',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $match: {
                            funding: {
                                $not: {
                                    $elemMatch: {
                                        userId: toObjectId(userId),
                                    },
                                },
                            },
                        },
                    },

                    {
                        $project: {
                            _id: 0,
                            __v: 0,
                            createdDate: 0,
                            modifyDate: 0,
                            existingFunding: 0,
                            borrowerId: 0,
                            user: 0,
                            funding: 0,
                        },
                    },
                    // // {
                    // //     $lookup: {
                    // //         from: 'users',
                    // //         let: { userId: '$userId' },
                    // //     }
                    // // }
                ])
                .exec();

            return fundings;
        } catch (error) {
            throw error;
        }
    }
}

export default LoanService;
