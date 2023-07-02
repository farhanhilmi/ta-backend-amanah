import paymentModels from '../../database/models/loan/payment.models.js';
import refreshToken from '../../database/models/refreshToken.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';
import RefreshTokenRepository from '../../database/repository/refreshToken.repository.js';
import * as authentication from '../../middleware/authentication.js';

import BorrowerService from '../../services/borrower.service.js';
const borrowerService = new BorrowerService();

describe('Borrower loan bill ~ Success scenario', () => {
    beforeAll(() => {
        jest.spyOn(paymentModels, 'aggregate').mockReturnValue([
            {
                currentMonth: 1000000,
                paymentSchedule: [
                    {
                        date: '2021-01-01',
                        amount: 1000000,
                    },
                ],
            },
        ]);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should return borrower payment bill', async () => {
        const result = await borrowerService.getPaymentSchedule();
        expect(result).toEqual({
            currentMonth: 1000000,
            paymentSchedule: [
                {
                    date: '2021-01-01',
                    amount: 1000000,
                },
            ],
        });
    });
});

describe('Borrower loan bill ~ Bad scenario', () => {
    beforeAll(() => {
        authentication.authenticateToken = jest.fn().mockResolvedValue({
            message:
                'You are not authorized. Please login first to access this page',
        });
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should throw error when user not logged in', async () => {
        const loggedIn = await authentication.authenticateToken();
        expect(loggedIn.message).toBe(
            'You are not authorized. Please login first to access this page',
        );
    });
});
