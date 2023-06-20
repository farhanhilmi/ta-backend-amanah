import { toObjectId } from '../../utils/index.js';

export default [
    {
        _id: '64880a090e51f774902f166c',
        userId: toObjectId('64880a090e51f774902f166c'),
        loanLimit: null,
        income: null,
        status: 'verified',
        performance: {
            borrowingRecord: {
                borrowedFund: 0,
                totalBorrowing: 0,
            },
            repayment: {
                earlier: 0,
                onTime: 0,
                late: 0,
            },
        },
        createdDate: {
            $date: {
                $numberLong: '1686637065559',
            },
        },
        modifyDate: {
            $date: {
                $numberLong: '1686637122316',
            },
        },
        __v: 0,
    },
];
