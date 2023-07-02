import loansModels from '../../database/models/loan/loans.models.js';
// import LoanRepository from '../../database/repository/loan.repository.js';
import LoanService from '../../services/loan.service.js';
// import * as redis from '../../ utils/redis.js';
const loanService = new LoanService();

describe('getAvailableLoans', () => {
    let countSpy;

    beforeAll(() => {
        // const loanRepo = new LoanRepository();
        // jest.spyOn(
        //     LoanRepository.prototype,
        //     'filterAvailableLoans',
        // ).mockImplementationOnce(() => [
        //     {
        //         _id: '6445ffa60cfd73ccc903960c',
        //         userId: '6445fd1319df4e1b0146d8b8',
        //         loanPurpose: 'Lahiran',
        //         amount: '8500000',
        //         tenor: 3,
        //         interestRate: '250000',
        //         status: 'on request',
        //         createdDate: '2023-04-24T04:03:50.199Z',
        //         user: {
        //             name: 'isco',
        //             email: 'isco@yopmail.com',
        //             phoneNumber: 6285333602646,
        //             faceImage: 'false',
        //         },
        //     },
        // ]);
        // jest.spyOn(LoanRepository.prototype, 'lookupFind').mockImplementationOnce(
        //     () => [
        //         {
        //             _id: '6445ffa60cfd73ccc903960c',
        //             userId: '6445fd1319df4e1b0146d8b8',
        //             loanPurpose: 'Lahiran',
        //             amount: '8500000',
        //             tenor: 3,
        //             interestRate: '250000',
        //             status: 'on request',
        //             createdDate: '2023-04-24T04:03:50.199Z',
        //             user: {
        //                 name: 'isco',
        //                 email: 'isco@yopmail.com',
        //                 phoneNumber: 6285333602646,
        //                 faceImage: 'false',
        //             },
        //         },
        //     ],
        // );
        // redis.isCached = jest.fn().mockResolvedValue(false);
        // redis.setCache = jest.fn().mockResolvedValue(false);
    });

    beforeEach(() => {
        countSpy = jest
            .spyOn(loansModels, 'countDocuments')
            .mockImplementationOnce(() => 1);
    });

    afterEach(() => {
        countSpy.mockClear();
    });

    afterAll(() => {
        // jest.restoreAllMocks();
    });

    describe('Get Available Loans', () => {
        it('must return list of available loans', async () => {
            const result = await loanService.showAvailableLoans({});
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result.meta).toHaveProperty('pagination');
            expect(typeof result.data).toBe('object');
            expect(result.data.length).toBeGreaterThan(0);
        });
    });

    describe('Get Available Loans - With Search', () => {
        it('must return list of available loan according to user search query', async () => {
            const result = await loanService.showAvailableLoans({
                q: 'Lahiran',
            });

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result.meta).toHaveProperty('pagination');
            expect(typeof result.data).toBe('object');
            expect(result.data.length).toBeGreaterThan(0);
        });

        it('must return empty list when data not found', async () => {
            const result = await loanService.showAvailableLoans({
                q: 'Pendidikan',
            });
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result.meta).toHaveProperty('pagination');
            expect(typeof result.data).toBe('object');
            expect(result.data.length == 0).toBeTruthy();
        });
    });
});
