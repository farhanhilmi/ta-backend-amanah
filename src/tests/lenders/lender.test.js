import refreshToken from '../../database/models/refreshToken.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';
import RefreshTokenRepository from '../../database/repository/refreshToken.repository.js';
import * as URL from 'url';

import LenderService from '../../services/lender.service.js';
const lenderService = new LenderService();
import * as authentication from '../../middleware/authentication.js';
import lenderModel from '../../database/models/lender/lender.model.js';

beforeAll(() => {
    // jest.spyOn(lenderModel, 'aggregate').mockImplementationOnce(() => ({
    //     exec: jest.fn(),
    // }));
    // jest.mock('../../database/models/lender/lender.model.js', () => {
    //     return {
    //         aggregate: jest.fn().mockResolvedValue([
    //             {
    //                 borrowerId: '640410c5465ed9af9ccb8912',
    //                 name: 'Zinedine Zidane',
    //                 email: 'zidane@mail.com',
    //                 verfiied: true,
    //                 phoneNumber: 628533322211,
    //                 profilePicture:
    //                     'https://firebase.com/640410c5465ed9af9ccb8912/profilePicture.jpg',
    //             },
    //         ]),
    //         exec: jest.fn(),
    //     };
    // });
    // jest.spyOn(lenderModel, 'aggregate').mockImplementationOnce(() => ([
    //     {
    //         exec: jest.fn(),
    //         borrowerId: '640410c5465ed9af9ccb8912',
    //         name: 'Zinedine Zidane',
    //         email: 'zidane@mail.com',
    //         verfiied: true,
    //         phoneNumber: 628533322211,
    //         profilePicture:
    //             'https://firebase.com/640410c5465ed9af9ccb8912/profilePicture.jpg',
    //     },
    // ]));
});
afterAll(() => {
    // jest.restoreAllMocks();
});

describe('Lender ~ Success scenario', () => {
    it('should return lender profile', async () => {
        const result = await lenderService.getLenderProfile(
            '6445ffa60cfd73ccc903960c',
        );
        // console.log('result', result);
        expect(result.email).toBe('toni@gmail.com');
    });

    it('should create new funding', async () => {
        const user = {
            userId: '6445ffa60cfd73ccc903960c',
            roles: 'lender',
        };
        const payload = {
            loanId: '6445ffa60cfd73ccc903961c',
            amount: 1000000,
        };
        const result = await lenderService.createFundings(user, payload);
        console.log('result', result);
    });

    it('should create new auto funding', async () => {
        const result = await lenderService.jajaja();
    });

    it('should return lender"s profit', async () => {
        const result = await lenderService.jajaja();
    });

    it('should return lender"s portfolio', async () => {
        const result = await lenderService.jajaja();
    });
});

describe('Lender ~ Bad scenario', () => {
    it('should throw error when user not logged in', async () => {
        const loggedIn = await authentication.authenticateToken();
        expect(loggedIn.message).toBe(
            'You are not authorized. Please login first to access this page',
        );
    });

    it('should throw error when user try to fund loan but balance not enough', async () => {
        const result = await lenderService.jajaja();
    });

    it('should throw error when loanId not found', async () => {
        const result = await lenderService.jajaja();
    });

    it('should throw error when payload not complete', async () => {
        const result = await lenderService.jajaja();
    });
});
