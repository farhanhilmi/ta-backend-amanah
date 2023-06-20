import { jest } from '@jest/globals';
import db from './db.js';
import mongoose from 'mongoose';
const objectId = mongoose.Types.ObjectId;

// import db from './db.js';
// import BeratRepository from '../database/repository/beratRepo.js';
// import BeratModel from '../database/models/beratBadan.js';
// import UsersModel from '../database/models/users.js';
// import AuthService from '../services/auth.js';
import * as Utils from '../utils/mail/index.js';
import lendersSeed from './seeds/lenders.js';
import loansSeed from './seeds/loans.js';
import borrowerSeed from './seeds/borrower.js';
import * as URL from 'url';
import * as authentication from '../middleware/authentication.js';
import { toObjectId } from '../utils/index.js';

const resultData = [
    {
        _id: toObjectId('6445ffa60cfd73ccc903960c'),
        name: 'Toni Kroos',
        email: 'toni@gmail.com',
        password:
            'mQHY/dde46oVJGfF/7W2Gw==.BHVolSYzOG1IYQ06gOQgvDIQKqSmfvmvfdpEjnUvnHiu9dvlcbFAbBshHXpUI/SKO9XyptTc+Xxo48AFV6sa9w==',
        salt: 'mQHY/dde46oVJGfF/7W2Gw==',
        verified: true,
        roles: 'lender',
        phoneNumber: '089283823',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
        __v: 0,
    },
    {
        _id: '6445fd1319df4e1b0146d8b8',
        name: 'Luka Modric',
        email: 'modric@gmail.com',
        password:
            'mQHY/dde46oVJGfF/7W2Gw==.BHVolSYzOG1IYQ06gOQgvDIQKqSmfvmvfdpEjnUvnHiu9dvlcbFAbBshHXpUI/SKO9XyptTc+Xxo48AFV6sa9w==',
        salt: 'mQHY/dde46oVJGfF/7W2Gw==',
        verified: false,
        roles: 'borrower',
        phoneNumber: '089283822',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
        __v: 0,
    },
    {
        _id: new objectId('6445fd1319df4e1b0146d8b8'),
        name: 'isco',
        email: 'isco@yopmail.com',
        phoneNumber: 6285333602646,
        password:
            'bzAhkoUoDtenJPqph0tpPw==.dnbYyJOFNBtHYDQDYqJwW8zv1NY1gqCYog3lx4S5E56wgIIlH6YrQwNgJjuWEYozVQUWKJ8oC3eZTlJrxTSC2A==',
        salt: 'bzAhkoUoDtenJPqph0tpPw==',
        verified: true,
        roles: 'borrower',
        birthDate: 'false',
        idCardNumber: 0,
        idCardImage: 'false',
        faceImage: 'false',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
        __v: 0,
    },
];

// beforeAll(async () => {
//     // jest.spyOn(UsersModel, 'findById').mockReturnValue(
//     //     Promise.resolve({
//     //         _id: '63edc92b7926224a7188b4ac',
//     //         name: 'Eden Hazard',
//     //         email: 'eden@gmail.com',
//     //         password: '133',
//     //         salt: 'kfaj73ejfe',
//     //         verified: true,
//     //         roles: 'lender',
//     //     }).then(() => ({ exec: jest.spyOn(UsersModel, 'exec') })),
//     // );
//     // UsersModel.findById = jest.fn().mockImplementation(() => ({
//     //     exec: jest
//     //         .fn()
//     //         .mockResolvedValue([
//     //             { _id: '63edc92b7926224a7188b4ac' },
//     //             { _id: '63edc92b7926224a7188b4aa' },
//     //         ]),
//     // }));
//     // const findByIdMock = jest.spyOn(UsersModel, 'findById');
//     // const results = resultData;
//     // const usersRes = jest.fn((ya) => {
//     //     console.log('YAA', ya);
//     // });
//     // const AccountFindResult = {
//     //     exec: usersRes,
//     // };
//     // const AccountFind = jest.fn(() => AccountFindResult);
//     // findByIdMock.mockImplementation(AccountFind);
// });

beforeAll(async () => {
    // jest.mock('./../config/meta/importMetaUrl', () => ({
    //     importMetaUrl: () => 'http://www.example.org',
    // }));

    Utils.sendMailOTP = jest.fn().mockResolvedValue({
        otp: '23456',
        otpExpired: '2020-10-10',
    });

    authentication.authenticateToken = jest.fn().mockResolvedValue({
        message:
            'You are not authorized. Please login first to access this page',
    });

    URL.fileURLToPath = jest
        .fn()
        .mockReturnValue('http://localhost:3000/borrower/loan-bill');

    // jest.setTimeout(60000);
    await db.connect();
    const DB = await db.getDB();
    await DB.collection('users').insertMany(resultData);
    await DB.collection('lenders').insertMany(lendersSeed);
    await DB.collection('borrowers').insertMany(borrowerSeed);
    await DB.collection('loans').insertMany(loansSeed);
});

beforeEach(async () => {
    // const auth = new AuthService();
    // await Promise.all(resultData.map((item) => auth.createAccount(item)));
    // await UsersModel.findOneAndUpdate(
    //     { email: resultData[1].email },
    //     { verified: true },
    // );
    // await db.connect();
});

afterEach(async () => {
    // await db.clear();
});

afterAll(async () => {
    jest.restoreAllMocks();

    await db.clear();
    await db.close();
});
