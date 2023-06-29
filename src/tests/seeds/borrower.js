import { toObjectId } from '../../utils/index.js';

export default [
    {
        _id: '64880a090e51f774902f166c',
        userId: toObjectId('6445fd1319df4e1b0146d8b7'),
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
        createdDate: '2023-06-13T06:16:23.573+00:00',
        modifyDate: '2023-06-13T06:16:23.573+00:00',
    },
];
