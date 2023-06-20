import borrowerModels from '../../database/models/borrower/borrower.models.js';
import refreshToken from '../../database/models/refreshToken.model.js';
import usersModel from '../../database/models/users.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';
import RefreshTokenRepository from '../../database/repository/refreshToken.repository.js';

import BorrowerService from '../../services/borrower.service.js';
import createLoan from '../../services/loans/createLoan.js';
const borrowerService = new BorrowerService();
import * as authentication from '../../middleware/authentication.js';

beforeAll(() => {
    jest.spyOn(borrowerModels, 'findOne').mockImplementationOnce(() => ({
        value: jest.fn(),
        _id: '6445fd1319df4e1b0146d8b2',
        userId: '6445fd1319df4e1b0146d8b1',
        status: 'verified',
    }));

    jest.spyOn(usersModel, 'findOne').mockImplementationOnce(() => ({
        value: jest.fn(),
        _id: '6445fd1319df4e1b0146d8b2',
        name: 'Farhan',
        email: 'ahah@gmail.com',
        phoneNumber: 622902942,
    }));
});
afterAll(() => {
    jest.restoreAllMocks();
});

describe('Borrower loan ~ Success scenario', () => {
    it('should create new loan', async () => {
        const user = {
            userId: '6445fd1319df4e1b0146d8b1',
            roles: 'borrower',
        };
        const payload = {
            purpose: 'Pinjaman',
            amount: 500000,
            tenor: 1,
            yieldReturn: 50000,
            paymentSchema: 'Pelunasan Langsung',
            borrowingCategory: 'Hiburan',
        };
        const result = await borrowerService.requestLoan(user, payload);
        expect(result).toBeTruthy();
    });
});

describe('Borrower loan ~ Bad scenario', () => {
    beforeAll(() => {});
    afterAll(() => {});

    it('should throw error when payload not provided', async () => {
        const user = {
            userId: '6445fd1319df4e1b0146d8b1',
            roles: 'borrower',
        };
        const payload = {
            amount: 500000,
            tenor: 1,
            yieldReturn: 50000,
            paymentSchema: 'Pelunasan Langsung',
            borrowingCategory: 'Hiburan',
        };
        await expect(() =>
            borrowerService.requestLoan(user, payload),
        ).rejects.toThrow('purpose field(s) are required!');
    });

    it('should throw error when user not logged in', async () => {
        const loggedIn = await authentication.authenticateToken();
        expect(loggedIn.message).toBe(
            'You are not authorized. Please login first to access this page',
        );
    });

    it('should throw error when returnYield (imbal hasil) is below 50.000', async () => {
        const user = {
            userId: '6445fd1319df4e1b0146d8b1',
            roles: 'borrower',
        };
        const payload = {
            amount: 500000,
            purpose: 'Pinjaman',
            tenor: 1,
            yieldReturn: 10000,
            paymentSchema: 'Pelunasan Langsung',
            borrowingCategory: 'Hiburan',
        };
        await expect(() =>
            borrowerService.requestLoan(user, payload),
        ).rejects.toThrow('Minimum loan yield is 50000');
    });
});
