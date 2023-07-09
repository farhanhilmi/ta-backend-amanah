// import request from 'supertest';
import axios from 'axios';
import verifyTokenModel from '../../database/models/verifyToken.model.js';
import bcrypt from 'bcrypt';
import UsersRepository from '../../database/repository/users.repository.js';
import usersModel from '../../database/models/users.model.js';
import request from 'supertest';
import otpModel from '../../database/models/otp.model.js';
import OTPRepository from '../../database/repository/otp.repository.js';

const port = 8000; // Specify the port on which your Express.js application is running
const baseUrl = `http://localhost:${port}`; //

describe('Authentication ~ Positive Case', () => {
    beforeAll(() => {
        // jest.spyOn(UsersRepository.prototype, 'findById').mockReturnValue({
        //     _id: '6445fd1319df4e1b0146d8b8',
        //     email: 'modric@gmail.com',
        //     verified: false,
        //     roles: 'lender',
        // });

        // jest.spyOn(
        //     UsersRepository.prototype,
        //     'updateVerifiedUser',
        // ).mockReturnValue({
        //     _id: '6445fd1319df4e1b0146d8b8',
        //     email: 'modric@gmail.com',
        //     roles: 'lender',
        // });

        jest.mock('../../database/repository/users.repository.js');

        jest.spyOn(verifyTokenModel, 'findOne').mockImplementationOnce(() => ({
            token: 'emailtokenverify',
        }));
        jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => true);

        // jest.spyOn(RefreshTokenRepository.prototype, 'create').mockReturnValue({
        //     _id: '6445ffa60cfd73ccc903960c',
        // });

        // jest.spyOn(OTPRepository.prototype, 'findOne').mockReturnValue({
        //     _id: '6445ffa60cfd73ccc903962c',
        //     expired: '2024-08-01T00:00:00.000Z',
        //     otp: '12345',
        // });
    });
    afterAll(() => {
        // jest.restoreAllMocks();
    });

    test('POST /authentication/register should create new user', async () => {
        const newUser = {
            name: 'Eden Hazard',
            email: 'eden@yopmail.com',
            password: 'Jari$yaya',
            roles: 'lender',
            phoneNumber: 62892838232,
        };

        const response = await axios.post(
            `${baseUrl}/api/authentication/register`,
            newUser,
        );

        // console.log('response', response);
        expect(response.status).toBe(201);
        expect(response.data.message).toBe(
            'We have sent you an email verification link. Please check your email to verify your account.',
        );
        expect(response.data.data.email).toBe('eden@yopmail.com');
        // expect(response.body).toHaveProperty('id');
        // expect(response.body.name).toBe(newUser.name);
        // expect(response.body.email).toBe(newUser.email);
    });

    test('POST /authentication/verification/email/{userId}/{token} should verify email', async () => {
        const mockData = {
            _id: '6445fd1319df4e1b0146d8b8',
        };

        const response = await axios.post(
            `${baseUrl}/api/authentication/verification/email/${mockData._id}/16e5d128cde75c5733376357b58a4d3a21ab8a1b55f1a1ffc97494cc4cbd34e9`,
        );

        expect(response.status).toBe(200);
        expect(response.data.message).toBe(
            'Your account has been successfully verified.',
        );
    });

    test('POST /authentication/login should get access token', async () => {
        let payload = {
            email: 'modric@gmail.com',
            password: 'Test@123',
        };

        // jest.spyOn(OTPRepository.prototype, 'findOne').mockReturnValue({
        //     otp: '123456',
        // });

        const res = await axios.post(
            `${baseUrl}/api/authentication/login?action=email-otp`,
            payload,
        );
        const { otp } = await otpModel.findOne({
            userId: res.data.data.userId,
        });

        payload = {
            email: 'modric@gmail.com',
            otp,
        };

        const response = await axios.post(
            `${baseUrl}/api/authentication/login?action=login`,
            payload,
        );

        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Login success');
        expect(response.data.data).toHaveProperty('accessToken');
        // expect(response.body).toHaveProperty('id');
        // expect(response.body.name).toBe(newUser.name);
        // expect(response.body.email).toBe(newUser.email);
    });
});

describe('Authentication ~ Negatif Case', () => {
    beforeAll(() => {});
    afterAll(() => {
        // jest.restoreAllMocks();
    });

    test('POST /authentication/register should return 422', async () => {
        try {
            const newUser = {
                name: 'Sergio ramos',
                // email: 'eden@yopmail.com',
                // password: 'Jari$yaya',
                roles: 'lender',
                // phoneNumber: 62892838232,
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/register`,
                newUser,
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('POST /authentication/register should return 422 when phone number invalid', async () => {
        try {
            const newUser = {
                name: 'Sergio ramos',
                email: 'edejajan@yopmail.com',
                password: 'Jari$yaya',
                roles: 'lender',
                // phoneNumber: 62892838232,
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/register`,
                newUser,
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('POST /authentication/register should return 409 for existing email', async () => {
        try {
            const newUser = {
                name: 'eden',
                email: 'eden@yopmail.com',
                password: 'Jari$yaya',
                roles: 'lender',
                phoneNumber: 62892838232,
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/register`,
                newUser,
            );
        } catch (error) {
            expect(error.response.status).toBe(409);
        }
    });

    test('POST /authentication/register should return 422 for invalid password validation', async () => {
        try {
            const newUser = {
                name: 'james',
                email: 'james@yopmail.com',
                password: 'Jari',
                roles: 'lender',
                phoneNumber: 62892838232,
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/register`,
                newUser,
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
            expect(error.response.data.message).toBe(
                'Password must be 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character',
            );
        }
    });

    test('POST /authentication/verification/email/{userId}/{token} return 409 already verified', async () => {
        try {
            const mockData = {
                _id: '6445ffa60cfd73ccc903960c',
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/verification/email/${mockData._id}/16e5d128cde75c5733376357b58a4d3a21ab8a1b55f1a1ffc97494cc4cbd34e9`,
            );
        } catch (error) {
            expect(error.response.status).toBe(409);
            expect(error.response.data.message).toBe(
                'Your account already verified',
            );
        }
    });

    // test('POST /authentication/verification/email/{userId}/{token} return 400 invalid params/body', async () => {
    //     try {
    //         const mockData = {
    //             _id: '6445ffa60cfd73ccc903960c',
    //         };

    //         const response = await axios.post(
    //             `${baseUrl}/api/authentication/verification/email/${mockData._id}/16e5d128cde75c5733376357b58a4d3a21ab8a1b55f1a1ffc97494cc4cbd34e9`,
    //         );
    //     } catch (error) {
    //         expect(error.response.status).toBe(400);
    //         expect(error.response.data.message).toBe('userId & token is required!');
    //     }
    // });

    test('POST /authentication/login should return 404 for user not found', async () => {
        try {
            let payload = {
                email: 'notfounduser@gmail.com',
                password: 'Test@123',
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/login?action=email-otp`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.message).toBe(
                'Your account is not registered. Please register your account first.',
            );
        }
    });

    test('POST /authentication/login should return 422 invalid payload', async () => {
        try {
            let payload = {
                password: 'Test@123',
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/login?action=email-otp`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
            expect(error.response.data.message).toBe(
                'Body must be contain email and password',
            );
        }
    });

    test('POST /authentication/login should return 403 invalid password', async () => {
        try {
            let payload = {
                email: 'modric@gmail.com',
                password: 'Tes23',
            };

            const response = await axios.post(
                `${baseUrl}/api/authentication/login?action=email-otp`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
            expect(error.response.data.message).toBe('Password incorrect!');
        }
    });
});
