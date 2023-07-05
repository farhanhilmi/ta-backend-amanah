import fundingModels from '../models/loan/funding.models.js';
import loansModels from '../models/loan/loans.models.js';
import usersModel from '../models/users.model.js';

const loanStatus = {
    $cond: {
        if: {
            $or: [
                { $eq: ['$status', 'on request'] },
                { $eq: ['$status', 'on process'] },
                // { $eq: ['$status', 'disbursement'] },
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

export default class AdminRepository {
    async findTotalLoanFunding(page, limit, sort, order) {
        try {
            const sortOrder = order === 'asc' ? 1 : -1;
            const borrower = await loansModels.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        totalLoans: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $addFields: {
                        userId: '$_id',
                        email: '$user.email',
                        name: '$user.name',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: 0,
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
            ]);

            const lender = await fundingModels.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        totalLoans: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $addFields: {
                        userId: '$_id',
                        email: '$user.email',
                        name: '$user.name',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: 0,
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
            ]);

            return {
                borrower,
                lender,
            };
        } catch (error) {
            throw error;
        }
    }
    async findAllFundings() {
        try {
            return await fundingModels.aggregate([
                {
                    $addFields: {
                        fundingId: '$_id',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        modifyDate: 0,
                        __v: 0,
                    },
                },
            ]);
        } catch (error) {
            throw error;
        }
    }

    async findAllLoans() {
        try {
            const loans = loansModels
                .aggregate([
                    {
                        $lookup: {
                            from: 'fundings',
                            localField: '_id',
                            foreignField: 'loanId',
                            as: 'fundings',
                        },
                    },
                    {
                        $addFields: {
                            loanId: '$_id',
                            status: loanStatus,
                            totalFunding: {
                                $cond: {
                                    if: { $eq: ['$fundings', []] },
                                    then: 0,
                                    else: {
                                        $toInt: {
                                            $sum: '$fundings.amount',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            modifyDate: 0,
                            __v: 0,
                            fundings: 0,
                        },
                    },
                ])
                .exec();
            return loans;
        } catch (error) {
            throw error;
        }
    }
    async findAllKycRequest() {
        try {
            const data = await usersModel
                .aggregate([
                    {
                        $lookup: {
                            from: 'lenders',
                            let: { userId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        '$userId',
                                                        '$$userId',
                                                    ],
                                                },
                                                {
                                                    $in: [
                                                        '$status',
                                                        ['pending'],
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: 'lenders',
                        },
                    },
                    {
                        $lookup: {
                            from: 'borrowers',
                            let: { userId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        '$userId',
                                                        '$$userId',
                                                    ],
                                                },
                                                {
                                                    $in: [
                                                        '$status',
                                                        ['pending'],
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: 'borrowers',
                        },
                    },
                    {
                        $lookup: {
                            from: 'work',
                            localField: '_id',
                            foreignField: 'userId',
                            as: 'workUser',
                        },
                    },
                    {
                        $unwind: '$workUser',
                    },
                    {
                        $match: {
                            $or: [
                                { 'lenders.0': { $exists: true } },
                                { 'borrowers.0': { $exists: true } },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            user: {
                                $cond: {
                                    if: { $eq: [{ $size: '$lenders' }, 0] },
                                    then: { $arrayElemAt: ['$borrowers', 0] },
                                    else: { $arrayElemAt: ['$lenders', 0] },
                                },
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'relatives',
                            localField: 'user.userId',
                            foreignField: 'userId',
                            as: 'relatives',
                        },
                    },
                    // {
                    //     $unwind: '$relatives',
                    // },
                    {
                        $addFields: {
                            userId: '$user.userId',
                            status: '$user.status',
                            'work.position': '$workUser.position',
                            'work.salary': '$workUser.salary',
                            relatives: {
                                $cond: {
                                    if: { $eq: [{ $size: '$relatives' }, 0] },
                                    then: [],
                                    else: {
                                        $map: {
                                            input: '$relatives',
                                            as: 'relative',
                                            in: {
                                                firstRelative:
                                                    '$$relative.firstRelative',
                                                secondRelative:
                                                    '$$relative.secondRelative',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $unwind: {
                            path: '$relatives',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            lenders: 0,
                            borrowers: 0,
                            user: 0,
                            _id: 0,
                            salt: 0,
                            password: 0,
                            __v: 0,
                            modifyDate: 0,
                            workUser: 0,
                        },
                    },
                ])
                .exec();
            return data;
        } catch (error) {
            throw error;
        }
    }
}
