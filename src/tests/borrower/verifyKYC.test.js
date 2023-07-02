import refreshToken from '../../database/models/refreshToken.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';
import RefreshTokenRepository from '../../database/repository/refreshToken.repository.js';

import BorrowerService from '../../services/borrower.service.js';
const borrowerService = new BorrowerService();
import * as authentication from '../../middleware/authentication.js';
import borrowerModels from '../../database/models/borrower/borrower.models.js';

beforeAll(() => {
    jest.spyOn(borrowerModels, 'findOne').mockImplementationOnce(() => ({
        value: jest.fn(),
        save: jest.fn(),
        _id: '6445fd1319df4e1b0146d8b2',
        userId: '6445fd1319df4e1b0146d8b8',
        status: 'not verified',
    }));
});
afterAll(() => {
    jest.restoreAllMocks();
});

describe('Borrower verify kyc ~ Success scenario', () => {
    it('should verify borrower KYC ', async () => {
        const payload = {
            'personal.fullName': 'Eden Hazard',
            'personal.gender': 'Male',
            'personal.birthDate': '1990-01-01',
            'personal.idCardNumber': '123456789098765',
            'personal.work.name': 'PNS',
            'personal.work.salary': 500000,
            'relativesContact.firstRelative.name': 'John Doe',
            'relativesContact.firstRelative.relation': 'Father',
            'relativesContact.firstRelative.phoneNumber': '628123456789',
            'relativesContact.secondRelative.name': 'John D',
            'relativesContact.secondRelative.relation': 'Father',
            'relativesContact.secondRelative.phoneNumber': '6281234356789',
        };
        const files = [];
        const result = await borrowerService.requestVerifyBorrower(
            '6445fd1319df4e1b0146d8b8',
            payload,
            files,
        );
        console.log('result', result);
    });
});

describe('Borrower verify kyc ~ Bad scenario', () => {
    beforeAll(() => {
        jest.spyOn(borrowerModels, 'findOne').mockImplementationOnce(() => ({
            value: jest.fn(),
            save: jest.fn(),
            _id: '6445fd1319df4e1b0146d8b2',
            userId: '6445fd1319df4e1b0146d8b8',
            status: 'not verified',
        }));
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should throw error when payload not provided', async () => {
        const payload = {
            'personal.gender': 'Male',
            'personal.birthDate': '1990-01-01',
            'personal.idCardNumber': '123456789098765',
            'personal.work.name': 'PNS',
            'personal.work.salary': 500000,
            'relativesContact.firstRelative.name': 'John Doe',
            'relativesContact.firstRelative.relation': 'Father',
            'relativesContact.firstRelative.phoneNumber': '628123456789',
            'relativesContact.secondRelative.name': 'John D',
            'relativesContact.secondRelative.relation': 'Father',
            'relativesContact.secondRelative.phoneNumber': '6281234356789',
        };

        await expect(() =>
            borrowerService.requestVerifyBorrower(
                '6445fd1319df4e1b0146d8b8',
                payload,
            ),
        ).rejects.toThrow('fullName field(s) in personal are required!');
    });

    it('should throw error when user not logged in', async () => {
        const loggedIn = await authentication.authenticateToken();
        expect(loggedIn.message).toBe(
            'You are not authorized. Please login first to access this page',
        );
    });
});
