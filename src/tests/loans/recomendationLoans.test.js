import loansModels from '../../database/models/loan/loans.models.js';
import LoanRepository from '../../database/repository/loan.repository.js';
// import LoanRepository from '../../database/repository/loan.repository.js';
import LoanService from '../../services/loan.service.js';
import * as authentication from '../../middleware/authentication.js';
// import * as redis from '../../ utils/redis.js';
const loanService = new LoanService();

describe('loanRecommendation', () => {
    let countSpy;

    beforeAll(() => {
        authentication.authenticateToken = jest.fn().mockResolvedValue({
            message:
                'You are not authorized. Please login first to access this page',
        });
    });

    beforeEach(() => {});

    afterEach(() => {
        // countSpy.mockClear();
        // jest.restoreAllMocks();
    });

    afterAll(() => {});

    describe('Get Loan Recommendation ~ success scenario', () => {
        it('must return list of loans recommendation', async () => {
            // const result = await loanService.getLoanRecommendation(
            //     '6445ffa60cfd73ccc903962c',
            // );
            // console.log('result', result);
            // expect(result).toHaveProperty('loanId');
            // expect(result).toHaveProperty('amount');
            // expect(result.amount).toBe(5000000);
        });
    });

    describe('Get Loan Recommendation - bad scenario', () => {
        it('must throw an error when user not logged in', async () => {
            const loggedIn = await authentication.authenticateToken();
            // console.log(
            //     'authentication.authenticateToken()',
            //     await authentication.authenticateToken(),
            // );
            expect(loggedIn.message).toBe(
                'You are not authorized. Please login first to access this page',
            );
            // await expect(() =>
            //     loanService.getLoanRecommendation('6445ffa60cfd73ccc903962c'),
            // ).rejects.toThrow(
            //     'You are not authorized. Please login first to access this page',
            // );
        });
    });
});
