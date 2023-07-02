import UsersService from '../../services/users.service.js';
const authService = new UsersService();

const refreshTokenMockedData = {
    get: (v) => v,
};

let objectSpy;

describe('Register ~ Success scenario', () => {
    it('must create a new user', async () => {
        const userInput = {
            name: 'Eden Hazard',
            email: 'eden@gmail.com',
            password: 'Jari$yaya',
            roles: 'lender',
            phoneNumber: 62892838232,
        };

        const result = await authService.createUser(userInput);
        expect(result).toHaveProperty('email', userInput.email);
    }, 10000);
});

describe('Register ~ Bad scenario', () => {
    it('should throw error when create a new user with no roles, phoneNumber', async () => {
        const userInput = {
            name: 'Eden Hazard',
            email: 'eden@gmail.com',
            password: 'Jari$yaya',
        };
        await expect(() => authService.createUser(userInput)).rejects.toThrow(
            'roles, phoneNumber field(s) are required!',
        );
    });

    it('should throw error when create a new user with invalid password', async () => {
        const userInput = {
            name: 'Eden Hazard',
            email: 'eden@gmail.com',
            password: 'Jari',
            roles: 'lender',
            phoneNumber: 62892838232,
        };
        await expect(() => authService.createUser(userInput)).rejects.toThrow(
            'Password must be 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character',
        );
    });

    it('should throw error when create a new user with existing email', async () => {
        const userInput = {
            name: 'Toni',
            email: 'toni@gmail.com',
            password: 'Jari@123',
            roles: 'lender',
            phoneNumber: 62892838232,
        };
        await expect(() => authService.createUser(userInput)).rejects.toThrow(
            'This e-mail address has already been registered',
        );
    });
});

// describe('Auth ~ Bad Scenario', () => {
//     it('must return error when create a new user with no password, roles, phoneNumber', async () => {
//         const userInput = {
//             name: 'Eden Hazard',
//             email: 'eden@gmail.com',
//         };

//         // expect(async () => await authService.createAccount(userInput)).toThrow(
//         //     'password,roles,phoneNumber is required!',
//         // );
//         await expect(() =>
//             authService.createAccount(userInput),
//         ).rejects.toThrow('password,roles,phoneNumber is required!');
//         // const t = async () => {
//         //     const result = await authService.createAccount(userInput);
//         //     throw new TypeError(result);
//         // };
//         // console.log('t', t);
//         // expect(t).toThrow(TypeError);
//         // expect(t).toThrow('UNKNOWN ERROR');
//         // try {
//         //     const userInput = {
//         //         name: 'Eden Hazard',
//         //         email: 'eden@gmail.com',
//         //     };
//         //     await authService.createAccount(userInput);
//         // } catch (error) {
//         //     const expected = 'password,roles,phoneNumber is required!';
//         //     expect(error).toBeInstanceOf(ValidationError);
//         //     expect(error).toHaveProperty('message', expected);
//         // }
//     });

//     it('must return error when create a new user with bad password', async () => {
//         const userInput = {
//             name: 'Eden Hazard',
//             email: 'eden@gmail.com',
//             password: '12345',
//             salt: 'kfaj73ejfe',
//             verified: true,
//             roles: 'lender',
//             phoneNumber: '0892838232',
//         };

//         // expect(async () => await authService.createAccount(userInput)).toThrow(
//         //     'password,roles,phoneNumber is required!',
//         // );
//         const expected =
//             'Password must be 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character';
//         await expect(() =>
//             authService.createAccount(userInput),
//         ).rejects.toThrow(expected);
//     });

//     it('must return error when create account with existing email', async () => {
//         const userInput = {
//             name: 'Eden Hazard',
//             email: 'toni@gmail.com',
//             password: '12345Jaijde$',
//             salt: 'kfaj73ejfe',
//             verified: true,
//             roles: 'lender',
//             phoneNumber: '0892838232',
//         };

//         const expected = 'This e-mail address has already been registered';
//         await expect(() =>
//             authService.createAccount(userInput),
//         ).rejects.toThrow(expected);
//     });
// });
