import loansModels from '../../database/models/loan/loans.models.js';
import LoanRepository from '../../database/repository/loan.repository.js';
// import LoanRepository from '../../database/repository/loan.repository.js';
import LoanService from '../../services/loan.service.js';
// import * as redis from '../../ utils/redis.js';
const loanService = new LoanService();

describe('detailLoans', () => {
    let countSpy;

    beforeAll(() => {
        jest.spyOn(LoanRepository.prototype, 'findLoanById').mockReturnValue({
            loanId: '6445ffa60cfd73ccc903962c',
            amount: 5000000,
            yieldReturn: 100000,
        });
    });

    beforeEach(() => {
        countSpy = jest
            .spyOn(loansModels, 'countDocuments')
            .mockImplementationOnce(() => 1);
    });

    afterEach(() => {
        countSpy.mockClear();
        jest.restoreAllMocks();
    });

    afterAll(() => {});

    describe('Get Detail Loans ~ success scenario', () => {
        it('must return loan detail', async () => {
            const result = await loanService.getLoanDetails(
                '6445ffa60cfd73ccc903962c',
            );
            console.log('result', result);
            expect(result).toHaveProperty('loanId');
            expect(result).toHaveProperty('amount');
            expect(result.amount).toBe(5000000);
        });
    });

    describe('Get Detail Loans - bad scenario', () => {
        it('must throw an error when loanId not found', async () => {
            await expect(() =>
                loanService.getLoanDetails('6445ffa60cfd73ccc903962c'),
            ).rejects.toThrow('Loan not found');
        });
    });
});
