import { toObjectId } from '../../utils/index.js';
import loansModels from '../models/loan/loans.models.js';

const loanStatus = {
    $cond: {
        if: {
            $or: [
                { $eq: ['$status', 'on request'] },
                { $eq: ['$status', 'on process'] },
            ],
        },
        then: 'tersedia',
        else: {
            $cond: {
                if: {
                    $eq: ['$status', 'in borrowing'],
                },
                then: 'penuh',
                else: {
                    $cond: {
                        if: {
                            $eq: ['$status', 'repayment'],
                        },
                        then: 'selesai',
                        else: {
                            $cond: {
                                if: {
                                    $eq: ['$status', 'unpaid'],
                                },
                                then: 'belum bayar',
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: ['$status', 'late repayment'],
                                        },
                                        then: 'telat bayar',
                                        else: 'unknown',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

export default class LoanRepository {
    constructor() {
        this.model = loansModels;
    }

    // function kajaj() {

    // }

    async getBorrowerLoanHistory(userId) {
        try {
            const loans = await this.model.aggregate([
                {
                    $match: {
                        userId: toObjectId(userId),
                    },
                },
                {
                    $lookup: {
                        from: 'borrower_contracts',
                        localField: '_id',
                        foreignField: 'loanId',
                        as: 'contract',
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
                    $unwind: {
                        path: '$contract',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $sort: {
                        createdDate: -1,
                    },
                },
                {
                    $group: {
                        _id: null,
                        active: {
                            $push: {
                                loanId: '$_id',
                                tenor: '$tenor',
                                amount: '$amount',
                                date: '$createdDate',
                                status: '$status',
                                totalFund: {
                                    $toInt: {
                                        $sum: '$funding.amount',
                                    },
                                },
                                yieldReturn: '$yieldReturn',
                                borrowingCategory: '$borrowingCategory',
                                purpose: '$purpose',
                                contract: '$contract.contractLink',
                                // totalLoanAmount: {
                                //     $toInt: {
                                //         $sum: '$amount',
                                //     },
                                // },
                            },
                        },
                        history: {
                            $push: {
                                loanId: '$_id',
                                tenor: '$tenor',
                                date: '$createdDate',
                                yieldReturn: '$yieldReturn',
                                amount: '$amount',
                                tenor: '$tenor',
                                status: '$status',
                                totalFunding: {
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
                                borrowingCategory: '$borrowingCategory',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        active: {
                            $filter: {
                                input: '$active',
                                as: 'loan',
                                cond: {
                                    $or: [
                                        {
                                            $eq: [
                                                '$$loan.status',
                                                'on request',
                                            ],
                                        },
                                        {
                                            $eq: [
                                                '$$loan.status',
                                                'on process',
                                            ],
                                        },
                                        {
                                            $eq: [
                                                '$$loan.status',
                                                'in borrowing',
                                            ],
                                        },
                                        {
                                            $eq: [
                                                '$$loan.status',
                                                'disbursement',
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        // history: '$history',
                        history: {
                            $filter: {
                                input: '$history',
                                as: 'loan',
                                cond: {
                                    $or: [
                                        // {
                                        //     $eq: [
                                        //         '$$loan.status',
                                        //         'in borrowing',
                                        //     ],
                                        // },
                                        {
                                            $eq: ['$$loan.status', 'repayment'],
                                        },
                                        {
                                            $eq: [
                                                '$$loan.status',
                                                'late repayment',
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },

                {
                    $project: {
                        active: {
                            $cond: {
                                if: { $eq: ['$active', []] },
                                then: [],
                                else: {
                                    $arrayElemAt: ['$active', 0],
                                },
                            },
                        },

                        history: 1,
                    },
                },
            ]);

            return loans[0];
        } catch (error) {
            throw error;
        }
    }

    async filterAvailableLoans(
        matchQuery,
        excludeUserFields = [],
        page = 1,
        limit = 10,
        sort = 'createdDate',
        order = 'desc',
    ) {
        try {
            let fields = {
                modifyDate: 0,
                borrowerId: 0,
                __v: 0,
                'borrower._id': 0,
                'borrower.__v': 0,
                funding: 0,
            };
            for (let i = 0; i < excludeUserFields.length; i++) {
                fields[`borrower.${excludeUserFields[i]}`] = 0;
            }
            // console.log('fields', fields);
            const sortOrder = order === 'asc' ? 1 : -1;
            return await this.model
                .aggregate([
                    {
                        $match: {
                            $or: matchQuery,
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'borrower',
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
                        $addFields: {
                            // subtract amount loan with amount funding
                            totalFunding: {
                                // check if funding is empty array, return 0, else return total funding
                                $cond: {
                                    if: { $eq: ['$funding', []] },
                                    then: 0,
                                    else: {
                                        $toInt: {
                                            $sum: '$funding.amount',
                                        },
                                        // $subtract: [
                                        //     {
                                        //         $toInt: '$amount',
                                        //     },
                                        //     {
                                        //         $toInt: {
                                        //             $sum: '$funding.amount',
                                        //         },
                                        //     },
                                        // ],
                                    },
                                },
                            },
                        },
                    },
                    {
                        // remove array from result only return object
                        $unwind: '$borrower',
                    },
                    {
                        $project: fields,
                        // $project: {
                        //     modifyDate: 0,
                        //     borrowerId: 0,
                        //     __v: 0,
                        //     'user._id': 0,
                        //     'user.password': 0,
                        //     'user.salt': 0,
                        //     'user.idCardNumber': 0,
                        //     'user.birthDate': 0,
                        //     'user.idCardImage': 0,
                        //     'user.createdDate': 0,
                        //     'user.modifyDate': 0,
                        //     'user.__v': 0,
                        // },
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
                ])
                .exec();
        } catch (error) {
            throw error;
        }
    }

    async lookupFind(
        query,
        userId,
        page = 1,
        limit = 10,
        sort = 'createdDate',
        order = 'desc',
    ) {
        try {
            if (query['$and'].length < 1) {
                query = [];
            }
            const statusMatchQuery = [
                { status: 'on request' },
                { status: 'on process' },
            ];
            const sortOrder = order === 'asc' ? 1 : -1;
            return await this.model
                .aggregate([
                    {
                        $match: {
                            $and: [{ $or: statusMatchQuery }, { ...query }],
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'borrower',
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
                        // remove array from result only return object
                        $unwind: '$borrower',
                    },
                    {
                        $addFields: {
                            'borrower.borrowerId': '$borrower._id',
                            loanId: '$_id',
                            status: loanStatus,
                            risk: '$creditScore',

                            // subtract amount loan with amount funding
                            totalFunding: {
                                // check if funding is empty array, return 0, else return total funding
                                $cond: {
                                    if: { $eq: ['$funding', []] },
                                    then: 0,
                                    else: {
                                        $toInt: {
                                            $sum: '$funding.amount',
                                        },
                                        // $subtract: [
                                        //     {
                                        //         $toInt: '$amount',
                                        //     },
                                        //     {
                                        //         $toInt: {
                                        //             $sum: '$funding.amount',
                                        //         },
                                        //     },
                                        // ],
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
                            modifyDate: 0,
                            borrowerId: 0,
                            __v: 0,
                            funding: 0,
                            // status: 0,
                            _id: 0,
                            'borrower._id': 0,
                            'borrower.__v': 0,
                            'borrower.password': 0,
                            'borrower.salt': 0,
                            'borrower.idCardNumber': 0,
                            'borrower.birthDate': 0,
                            'borrower.idCardImage': 0,
                            'borrower.createdDate': 0,
                            'borrower.modifyDate': 0,
                            'borrower.verified': 0,
                            'borrower.roles': 0,
                            'borrower.phoneNumber': 0,
                            creditScore: 0,
                            'borrower.gender': 0,
                            'borrower.faceImage': 0,
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
                ])
                .exec();
        } catch (error) {
            throw error;
        }
    }

    async findLoanById(loanId) {
        try {
            const loan = await this.model
                .aggregate([
                    {
                        $match: { _id: toObjectId(loanId) },
                    },
                    {
                        $lookup: {
                            from: 'borrowers',
                            localField: 'borrowerId',
                            foreignField: '_id',
                            as: 'borrower',
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
                        $lookup: {
                            from: 'fundings',
                            localField: '_id',
                            foreignField: 'loanId',
                            as: 'funding',
                        },
                    },
                    {
                        $lookup: {
                            from: 'borrower_contracts',
                            localField: '_id',
                            foreignField: 'loanId',
                            as: 'borrower_contracts',
                        },
                    },
                    {
                        // remove array from result only return object
                        $unwind: '$borrower',
                    },
                    {
                        // remove array from result only return object
                        $unwind: '$borrower_contracts',
                    },
                    {
                        // remove array from result only return object
                        $unwind: '$user',
                    },
                    // {
                    //     $let: {
                    //         vars: {
                    //             borrowedFund: {
                    //                 $toInt: {
                    //                     $sum: '$amount',
                    //                 },
                    //             },
                    //         },
                    //         in: {
                    //             $addFields: {
                    //                 loanId: '$_id',
                    //             }
                    //     },
                    // },
                    {
                        $addFields: {
                            loanId: '$_id',
                            status: loanStatus,
                            // 'contract.borrower':
                            //     '$borrower_contracts.contractLink',
                            contract: '$borrower_contracts.contractLink',
                            risk: '$creditScore',
                            'borrower.name': '$user.name',
                            'borrower.borrowerId': '$borrower._id',
                            'borrower.email': '$user.email',
                            // 'borrower.borrowerId': '$borrower._id',
                            // 'borrower.creditScore': '500',
                            // subtract amount loan with amount funding
                            totalFunding: {
                                // check if funding is empty array, return 0, else return total funding
                                $cond: {
                                    if: { $eq: ['$funding', []] },
                                    then: 0,
                                    else: {
                                        $toInt: {
                                            $sum: '$funding.amount',
                                        },
                                        // $subtract: [
                                        //     {
                                        //         $toInt: '$amount',
                                        //     },
                                        //     {
                                        //         $toInt: {
                                        //             $sum: '$funding.amount',
                                        //         },
                                        //     },
                                        // ],
                                    },
                                },
                            },
                        },
                    },

                    {
                        $project: {
                            modifyDate: 0,
                            borrowerId: 0,
                            __v: 0,
                            funding: 0,
                            _id: 0,
                            user: 0,
                            userId: 0,
                            borrower_contracts: 0,
                            'borrower._id': 0,
                            'borrower.userId': 0,
                            'borrower.__v': 0,
                            'borrower.income': 0,
                            'borrower.status': 0,
                            'borrower.loanLimit': 0,
                            'borrower.createdDate': 0,
                            'borrower.modifyDate': 0,
                            creditScore: 0,
                        },
                    },
                    {
                        $limit: 1,
                    },
                ])
                .exec();
            console.log('loan', loan);

            return loan[0];
        } catch (error) {
            throw error;
        }
    }

    async findAutoLendMatch(matchQuery, amountToLend) {
        try {
            const statusMatchQuery = [
                { status: 'on request' },
                { status: 'on process' },
            ];
            return await loansModels
                .aggregate([
                    {
                        $match: {
                            $and: [{ $or: statusMatchQuery }, matchQuery],
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'borrower',
                        },
                    },
                    {
                        $lookup: {
                            from: 'fundings',
                            localField: '_id',
                            foreignField: 'loanId',
                            pipeline: [{ $project: { amount: 1 } }],
                            as: 'funding',
                        },
                    },
                    {
                        // check if available loan amount to fund is greater than amount to lend
                        $match: {
                            $expr: {
                                $let: {
                                    vars: {
                                        availableToFund: {
                                            // $sum: '$funding.amount',
                                            $subtract: [
                                                {
                                                    $toInt: '$amount',
                                                },
                                                {
                                                    $toInt: {
                                                        $sum: '$funding.amount',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    in: {
                                        $gte: [
                                            '$$availableToFund',
                                            parseInt(amountToLend),
                                        ],
                                    },
                                },
                            },
                        },
                    },

                    {
                        // remove array from result only return object
                        $unwind: '$borrower',
                    },
                    {
                        $addFields: {
                            totalFunds: {
                                $sum: '$funding.amount',
                            },
                        },
                    },
                    {
                        $project: {
                            modifyDate: 0,
                            borrowerId: 0,
                            __v: 0,
                            'borrower._id': 0,
                            'borrower.password': 0,
                            'borrower.salt': 0,
                            'borrower.idCardNumber': 0,
                            'borrower.birthDate': 0,
                            'borrower.idCardImage': 0,
                            'borrower.createdDate': 0,
                            'borrower.modifyDate': 0,
                            'borrower.__v': 0,
                        },
                    },
                ])
                .exec();
        } catch (error) {
            throw error;
        }
    }
}
