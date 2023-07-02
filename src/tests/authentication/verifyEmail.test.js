import verifyToken from '../../database/models/verifyToken.model.js';
import UsersRepository from '../../database/repository/users.repository.js';
import bcrypt from 'bcrypt';

import UsersService from '../../services/users.service.js';
const authService = new UsersService();

describe('Verificatin email ~ Success scenario', () => {
    beforeAll(async () => {
        jest.spyOn(UsersRepository.prototype, 'findById').mockReturnValue({
            _id: '6445ffa60cfd73ccc903960c',
            email: 'toni@gmail.com',
            verified: false,
            roles: 'lender',
        });

        jest.spyOn(
            UsersRepository.prototype,
            'updateVerifiedUser',
        ).mockReturnValue({
            _id: '6445ffa60cfd73ccc903960c',
            email: 'toni@gmail.com',
            roles: 'lender',
        });

        jest.spyOn(verifyToken, 'findOne').mockImplementationOnce(() => ({
            userId: '6445ffa60cfd73ccc903960c',
            token: '1724cf0bfbd86376e93bc923b29e6935178ec5100057b9ad90feffebff224232',
        }));

        jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => true);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });
    it('should verify user email', async () => {
        const result = await authService.verifyEmail(
            '6445ffa60cfd73ccc903960c',
            '1724cf0bfbd86376e93bc923b29e6935178ec5100057b9ad90feffebff224232',
        );
        expect(result).toHaveProperty('userId', '6445ffa60cfd73ccc903960c');
    });
});

describe('Verificatin email ~ Bad scenario', () => {
    beforeAll(async () => {
        jest.spyOn(UsersRepository.prototype, 'findById').mockReturnValue({
            _id: '6445ffa60cfd73ccc903960c',
            email: 'toni@gmail.com',
            verified: true,
        });

        jest.spyOn(
            UsersRepository.prototype,
            'updateVerifiedUser',
        ).mockReturnValue({
            _id: '6445ffa60cfd73ccc903960c',
            email: 'toni@gmail.com',
            roles: 'lender',
        });

        jest.spyOn(verifyToken, 'findOne').mockImplementationOnce(() => ({
            userId: '6445ffa60cfd73ccc903960c',
            token: '1724cf0bfbd86376e93bc923b29e6935178ec5100057b9ad90feffebff224232',
        }));
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should throw error when email already verified ', async () => {
        await expect(() =>
            authService.verifyEmail(
                '6445ffa60cfd73ccc903960c',
                '1724cf0bfbd86376e93bc923b29e6935178ec5100057b9ad90feffebff224232',
            ),
        ).rejects.toThrow('Your account already verified');
    });

    it('should throw error when parameter missing', async () => {
        await expect(() =>
            authService.verifyEmail('6445ffa60cfd73ccc903960c'),
        ).rejects.toThrow('userId & token is required!');
    });
});
