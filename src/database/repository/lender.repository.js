import { toObjectId } from '../../utils/index.js';
import lenderModel from '../models/lender/lender.model.js';
import fundingModels from '../models/loan/funding.models.js';

export default class LenderRepository {
    // constructor() {
    //     super(Lender);
    // }

    async getLenderPortfolio(userId) {
        const result = await fundingModels.aggregate([
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
                    as: 'Loan',
                },
            },
            {
                $unwind: '$Loan',
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'Loan.userId',
                    foreignField: '_id',
                    as: 'Loan.borrower',
                },
            },
            {
                $project: {
                    _id: 0,
                    funds: {
                        amount: '$amount',
                        yieldReturn: '$yield',
                        repaymentDate: '$createdDate',
                    },
                    Loan: {
                        borrower: {
                            $arrayElemAt: ['$Loan.borrower', 0],
                        },
                        loan: {
                            loanId: '$Loan._id',
                            amount: '$Loan.amount',
                            tenor: '$Loan.tenor',
                        },
                        status: '$Loan.status',
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    active: {
                        $push: {
                            $cond: [
                                {
                                    $in: [
                                        '$Loan.status',
                                        [
                                            'on process',
                                            'on request',
                                            'in borrowing',
                                            'unpaid',
                                        ],
                                    ],
                                },
                                {
                                    funds: '$funds',
                                    Loan: '$Loan',
                                },
                                null,
                            ],
                        },
                    },
                    done: {
                        $push: {
                            $cond: [
                                // { $eq: ['$Loan.status', 'repayment'] },
                                {
                                    $in: [
                                        '$Loan.status',
                                        ['repayment', 'late repayment'],
                                    ],
                                },
                                {
                                    funds: '$funds',
                                    Loan: '$Loan',
                                },
                                null,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    active: {
                        $filter: {
                            input: '$active',
                            as: 'a',
                            cond: { $ne: ['$$a', null] },
                        },
                    },
                    done: {
                        $filter: {
                            input: '$done',
                            as: 'd',
                            cond: { $ne: ['$$d', null] },
                        },
                    },
                },
            },
            {
                $project: {
                    active: {
                        $reduce: {
                            input: '$active',
                            initialValue: {
                                summary: {
                                    totalFunding: 0,
                                    totalYield: 0,
                                },
                                funding: [],
                            },
                            in: {
                                summary: {
                                    totalFunding: {
                                        $add: [
                                            '$$value.summary.totalFunding',
                                            '$$this.funds.amount',
                                        ],
                                    },
                                    totalYield: {
                                        $add: [
                                            '$$value.summary.totalYield',
                                            '$$this.funds.yieldReturn',
                                        ],
                                    },
                                },
                                funding: {
                                    $concatArrays: [
                                        '$$value.funding',
                                        [
                                            {
                                                funds: '$$this.funds',
                                                Loan: '$$this.Loan',
                                            },
                                        ],
                                    ],
                                },
                            },
                        },
                    },
                    done: {
                        $reduce: {
                            input: '$done',
                            initialValue: {
                                summary: {
                                    totalFunding: 0,
                                    totalYield: 0,
                                },
                                funding: [],
                            },
                            in: {
                                summary: {
                                    totalFunding: {
                                        $add: [
                                            '$$value.summary.totalFunding',
                                            '$$this.funds.amount',
                                        ],
                                    },
                                    totalYield: {
                                        $add: [
                                            '$$value.summary.totalYield',
                                            '$$this.funds.yieldReturn',
                                        ],
                                    },
                                },
                                funding: {
                                    $concatArrays: [
                                        '$$value.funding',
                                        [
                                            {
                                                funds: '$$this.funds',
                                                Loan: '$$this.Loan',
                                            },
                                        ],
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    active: {
                        summary: '$active.summary',
                        funding: {
                            $cond: {
                                if: { $eq: ['$active.funding', []] },
                                then: [],
                                else: {
                                    $map: {
                                        input: '$active.funding',
                                        as: 'a',
                                        in: {
                                            funds: '$$a.funds',
                                            // get only borrower name
                                            Loan: {
                                                borrower: {
                                                    name: '$$a.Loan.borrower.name',
                                                    creditScore: '500',
                                                },
                                                loan: '$$a.Loan.loan',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    done: {
                        summary: '$done.summary',
                        funding: {
                            $cond: {
                                if: { $eq: ['$done.funding', []] },
                                then: [],
                                else: {
                                    $map: {
                                        input: '$done.funding',
                                        as: 'a',
                                        in: {
                                            funds: '$$a.funds',
                                            // get only borrower name
                                            Loan: {
                                                borrower: {
                                                    name: '$$a.Loan.borrower.name',
                                                    creditScore: '500',
                                                },
                                                loan: '$$a.Loan.loan',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // {
            //     $project: {
            //         active: {
            //             summary: {
            //                 totalFunding: '$active.summary.totalFunding',
            //                 totalYield: '$active.summary.totalYield',
            //             },
            //             funding: '$active.funding',
            //         },
            //         // done: '$done',

            //         done: {
            //             summary: {
            //                 totalFunding: '$done.summary.totalFunding',
            //                 totalYield: '$done.summary.totalYield',
            //             },
            //             // done: '$done',
            //             funding: {
            //                 $cond: {
            //                     if: { $eq: ['$done.done', {}] },
            //                     then: [],
            //                     else: '$done.funding',
            //                 },
            //             },
            //         },
            //     },
            // },
            // {
            //     $project: {
            //         _id: 0,
            //         active: {
            //             summary: {
            //                 totalFunding: { $sum: '$active.funds.amount' },
            //                 totalYield: {
            //                     $sum: '$active.funds.yieldReturn',
            //                 },
            //             },
            //             funding: '$active',
            //         },
            //         done: {
            //             summary: {
            //                 totalFunding: { $sum: '$done.funds.amount' },
            //                 totalYield: { $sum: '$done.funds.yieldReturn' },
            //             },
            //             funding: '$done',
            //         },
            //     },
            // },
        ]);
        return result;
    }
}
