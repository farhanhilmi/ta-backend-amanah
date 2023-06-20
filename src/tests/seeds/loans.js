import mongoose from 'mongoose';

const objectId = mongoose.Types.ObjectId;

export default [
    {
        _id: '6445ffa60cfd73ccc903961c',
        userId: new objectId('6445fd1319df4e1b0146d8b8'),
        borrowerId: new objectId('64880a090e51f774902f166c'),
        purpose: 'Lahiran',
        amount: 8500000,
        tenor: 3,
        yieldReturn: 250000,
        paymentSchema: 'Pelunasan Langsung',
        borrowingCategory: 'Pendidikan',
        status: 'on request',
        createdDate: '1682309030199',
        modifyDate: '1682309030199',
        __v: 0,
    },
];
