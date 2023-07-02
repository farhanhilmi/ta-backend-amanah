import UsersService from '../../services/users.service.js';
const authService = new UsersService();

describe('Forget Password ~ Success scenario', () => {
    it('should generate link for reset password', async () => {
        const payload = {
            email: 'toni@gmail.com',
            platform: 'website',
        };
        const result = await authService.forgetPassword(payload);
        expect(result).not.toBeNull();
    });
});

describe('Forget Password ~ Bad scenario', () => {
    it('should throw error when email not found', async () => {
        const payload = {
            email: 'asa@gmail.com',
            platform: 'website',
        };
        await expect(() => authService.forgetPassword(payload)).rejects.toThrow(
            'We cannot find an account with that email',
        );
    });

    it('should throw error when payload not provided', async () => {
        const payload = {
            platform: 'website',
        };
        await expect(() => authService.forgetPassword(payload)).rejects.toThrow(
            'email field(s) is required!',
        );
    });
});
