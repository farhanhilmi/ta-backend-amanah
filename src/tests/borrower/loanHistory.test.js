import refreshToken from '../../database/models/refreshToken.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';
import RefreshTokenRepository from '../../database/repository/refreshToken.repository.js';

import BorrowerService from '../../services/borrower.service.js';
const borrowerService = new BorrowerService();
import * as authentication from '../../middleware/authentication.js';

describe('Borrower loan history ~ Success scenario', () => {
    beforeAll(() => {});
    afterAll(() => {
        // jest.restoreAllMocks();
    });

    it('should return borrower loan history', async () => {
        const result = await borrowerService.getLoanHistory(
            '6445fd1319df4e1b0146d8b8',
            'borrower',
        );
        expect(result).toHaveProperty('history');
        expect(result).toHaveProperty('active');
        expect(result.active.tenor).toBe(3);
    });
});

describe('Borrower loan history ~ Bad scenario', () => {
    beforeAll(() => {});
    afterAll(() => {});

    it('should throw error when user not logged in', async () => {
        const loggedIn = await authentication.authenticateToken();
        expect(loggedIn.message).toBe(
            'You are not authorized. Please login first to access this page',
        );
    });
});
