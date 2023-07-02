import refreshToken from '../../database/models/refreshToken.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';
import RefreshTokenRepository from '../../database/repository/refreshToken.repository.js';

import UsersService from '../../services/users.service.js';
const authService = new UsersService();

describe('Login ~ Success scenario', () => {
    beforeAll(async () => {
        jest.spyOn(refreshToken, 'findOne').mockImplementationOnce(() => ({
            remove: jest.fn(),
            deleteOne: jest.fn(),
            userId: '6445ffa60cfd73ccc903960c',
        }));

        jest.spyOn(RefreshTokenRepository.prototype, 'create').mockReturnValue({
            _id: '6445ffa60cfd73ccc903960c',
        });

        jest.spyOn(OTPRepository.prototype, 'findOne').mockReturnValue({
            _id: '6445ffa60cfd73ccc903962c',
            expired: '2024-08-01T00:00:00.000Z',
            otp: '12345',
        });
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should generate otp for login', async () => {
        const payload = {
            email: 'toni@gmail.com',
            password: 'Test@123',
        };
        const result = await authService.login(payload, 'email-otp');
        expect(result.message).toBe('OTP has been sent to your email');
        expect(result.data.userId).toBeTruthy();
    });

    it('should generate access and refresh token for login', async () => {
        const payload = {
            email: 'toni@gmail.com',
            otp: '12345',
        };
        const result = await authService.login(payload, 'login');
        expect(result.message).toBe('Login success');
    });
});

describe('Login ~ Bad scenario', () => {
    beforeAll(async () => {
        jest.spyOn(refreshToken, 'findOne').mockImplementationOnce(() => ({
            remove: jest.fn(),
            userId: '6445ffa60cfd73ccc903960c',
        }));

        jest.spyOn(RefreshTokenRepository.prototype, 'create').mockReturnValue({
            _id: '6445ffa60cfd73ccc903960c',
        });

        jest.spyOn(OTPRepository.prototype, 'findOne').mockReturnValue({
            _id: '6445ffa60cfd73ccc903962c',
            expired: '2024-08-01T00:00:00.000Z',
            otp: '12345',
        });
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should throw error when email not found', async () => {
        const payload = {
            email: 'tuoni@gmail.com',
            password: 'Test@123',
        };
        await expect(() =>
            authService.login(payload, 'email-otp'),
        ).rejects.toThrow(
            'Your account is not registered. Please register your account first.',
        );
    });

    it('should throw error when password is wrong', async () => {
        const payload = {
            email: 'toni@gmail.com',
            password: '12345',
        };
        await expect(() =>
            authService.login(payload, 'email-otp'),
        ).rejects.toThrow('Password incorrect!');
    });

    it('should throw error when payload not provided', async () => {
        const payload = {
            password: '12345',
        };
        await expect(() =>
            authService.login(payload, 'email-otp'),
        ).rejects.toThrow('Body must be contain email and password');
    });
});
