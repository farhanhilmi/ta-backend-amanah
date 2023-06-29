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
import usersModel from '../database/models/users.model.js';
import { clear, close } from '../database/connection.js';
import lenderModel from '../database/models/lender/lender.model.js';
import borrowerModels from '../database/models/borrower/borrower.models.js';
import loansModels from '../database/models/loan/loans.models.js';
import verifyTokenModel from '../database/models/verifyToken.model.js';
import verifyEmailSeed from './seeds/verifyEmail.js';

import balanceSeed from './seeds/balance.js';
import relativesSeed from './seeds/relatives.js';
import workSeed from './seeds/work.js';
import borrowerContractSeed from './seeds/borrowerContract.js';
import workModels from '../database/models/borrower/work.models.js';
import balanceModel from '../database/models/balance.model.js';
import relativesModels from '../database/models/borrower/relatives.models.js';
import borrowerContractModels from '../database/models/loan/borrowerContract.models.js';

const resultData = [
    {
        _id: toObjectId('6445ffa60cfd73ccc903960c'),
        name: 'Toni Kroos',
        email: 'toni@gmail.com',
        password:
            'F0TsrArsnh4HIYuZ3dkDIg==.eqYTpp1O7C/iF7T3GPCN/yQ0fqwPfjggiYKrkvjc9vTd6VRgBgZ7+YQjO2vDjZOnYduxjR8zFHz0Y6vjTZ5BAQ==',
        salt: 'F0TsrArsnh4HIYuZ3dkDIg==',
        verified: true,
        roles: 'lender',
        phoneNumber: '089283823',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
        __v: 0,
    },
    {
        _id: new objectId('6445fd1319df4e1b0146d8b8'),
        name: 'Luka Modric',
        email: 'modric@gmail.com',
        password:
            'F0TsrArsnh4HIYuZ3dkDIg==.eqYTpp1O7C/iF7T3GPCN/yQ0fqwPfjggiYKrkvjc9vTd6VRgBgZ7+YQjO2vDjZOnYduxjR8zFHz0Y6vjTZ5BAQ==',
        salt: 'F0TsrArsnh4HIYuZ3dkDIg==',
        verified: false,
        roles: 'borrower',
        phoneNumber: '089283822',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
        __v: 0,
    },
    {
        _id: new objectId('6445fd1319df4e1b0146d8b7'),
        name: 'isco',
        email: 'isco@yopmail.com',
        phoneNumber: 6285333602646,
        password:
            'F0TsrArsnh4HIYuZ3dkDIg==.eqYTpp1O7C/iF7T3GPCN/yQ0fqwPfjggiYKrkvjc9vTd6VRgBgZ7+YQjO2vDjZOnYduxjR8zFHz0Y6vjTZ5BAQ==',
        salt: 'F0TsrArsnh4HIYuZ3dkDIg==',
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
    {
        _id: toObjectId('64880da9cf0c2cf9d2a00060'),
        name: 'lender',
        email: 'lender@yopmail.com',
        phoneNumber: 6285333602646,
        password:
            'GHJmY1mkZV+b8h4c2QVgGQ==.Gq4ZSNVgoO/SyAEU/DEhKQWHLw/H1X6f8euVMeJnlLLFKY8sZC/mrzzCnORR4SarvyKl4Gpfp1r2EWj4sM1tlw==',
        salt: 'GHJmY1mkZV+b8h4c2QVgGQ==',
        verified: true,
        roles: 'lender',
        birthDate: '2001-09-04',
        gender: 'male',
        idCardNumber: 234243242,
        idCardImage:
            'https://storage.googleapis.com/amanah-p2p-lending-syariah.appspot.com/lender/idCardImage/64880da9cf0c2cf9d2a00060-1687363705750',
        faceImage:
            'https://storage.googleapis.com/amanah-p2p-lending-syariah.appspot.com/lender/faceImage/64880da9cf0c2cf9d2a00060-1687363705750',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
    },
    {
        _id: toObjectId('64881019cf0c2cf9d2a00098'),
        name: 'lender many amount',
        email: 'lenderbaru@yopmail.com',
        phoneNumber: 62853233602646,
        password:
            'GHJmY1mkZV+b8h4c2QVgGQ==.Gq4ZSNVgoO/SyAEU/DEhKQWHLw/H1X6f8euVMeJnlLLFKY8sZC/mrzzCnORR4SarvyKl4Gpfp1r2EWj4sM1tlw==',
        salt: 'GHJmY1mkZV+b8h4c2QVgGQ==',
        verified: true,
        roles: 'lender',
        birthDate: '2001-09-04',
        gender: 'male',
        idCardNumber: 234243242,
        idCardImage:
            'https://storage.googleapis.com/amanah-p2p-lending-syariah.appspot.com/lender/idCardImage/64880da9cf0c2cf9d2a00060-1687363705750',
        faceImage:
            'https://storage.googleapis.com/amanah-p2p-lending-syariah.appspot.com/lender/faceImage/64880da9cf0c2cf9d2a00060-1687363705750',
        createdDate: '1682308371168',
        modifyDate: '1682308391600',
    },
];

beforeAll(async () => {
    console.log('before all');
    // // jest.mock('./../config/meta/importMetaUrl', () => ({
    // //     importMetaUrl: () => 'http://www.example.org',
    // // }));

    Utils.sendMailOTP = jest.fn().mockResolvedValue({
        otp: '23456',
        otpExpired: '2030-10-10',
    });

    authentication.authenticateToken = jest.fn().mockResolvedValue({
        message:
            'You are not authorized. Please login first to access this page',
    });

    URL.fileURLToPath = jest
        .fn()
        .mockReturnValue('http://localhost:3000/borrower/loan-bill');

    // // jest.setTimeout(60000);
    // await db.connect();
    // const DB = await db.getDB();
    // await DB.collection('users').insertMany(resultData);
    // await DB.collection('lenders').insertMany(lendersSeed);
    // await DB.collection('borrowers').insertMany(borrowerSeed);
    // await DB.collection('loans').insertMany(loansSeed);
    // Start the MongoDB memory server
    // mongoServer = await MongoMemoryServer.create();
    // const mongoUri = await mongoServer.getUri();

    // Connect Mongoose to the MongoDB memory server
    // await mongoose.connect(mongoUri, {
    //     useNewUrlParser: true,
    //     useUnifiedTopology: true,
    // });
    await usersModel.insertMany(resultData);
    await lenderModel.insertMany(lendersSeed);
    await borrowerModels.insertMany(borrowerSeed);
    await loansModels.insertMany(loansSeed);
    await verifyTokenModel.insertMany(verifyEmailSeed);
    await workModels.insertMany(workSeed);
    await relativesModels.insertMany(relativesSeed);
    await balanceModel.insertMany(balanceSeed);
    await borrowerContractModels.insertMany(borrowerContractSeed);
    // console.log('before', await usersModel.find());
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
    // await clear();
});

afterAll(async () => {
    jest.restoreAllMocks();
    await clear();
    // await close();

    // await connection.close();
    // Disconnect Mongoose from the MongoDB memory server
    // await mongoose.disconnect();
    // await mongoServer.stop();
    // await db.clear();
    // await db.close();
});
