// import request from 'supertest';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const port = 8000; // Specify the port on which your Express.js application is running
const baseUrl = `http://localhost:${port}`; //

const accessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDlmYTZkNzY2NmIyZjMyYjQ3NmY4NDgiLCJyb2xlcyI6ImJvcnJvd2VyIiwidmVyaWZpZWRFbWFpbCI6dHJ1ZSwidmVyaWZpZWRLWUMiOiJub3QgdmVyaWZpZWQiLCJpYXQiOjE2ODgxODQ3NzgsImV4cCI6MTY5NTk2MDc3OH0.gWalWeBW09FLBaFaSQJPhQg4KfcSwaE_hXdGfed2wM0';

const refreshToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDlmYTZkNzY2NmIyZjMyYjQ3NmY4NDgiLCJyb2xlcyI6ImJvcnJvd2VyIiwidmVyaWZpZWRFbWFpbCI6dHJ1ZSwidmVyaWZpZWRLWUMiOiJub3QgdmVyaWZpZWQiLCJpYXQiOjE2ODgxODQ3NzgsImV4cCI6MTY5NjgyNDc3OH0.72n5nJP2GEBLkk7YGh2Nagr8Iq5g0xSj9GGibwVemtI';

const accessTokenNotVerifyKYC =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDlmYWRhNDMwMTY3OTdkYTUxNDdlOTQiLCJyb2xlcyI6ImJvcnJvd2VyIiwidmVyaWZpZWRFbWFpbCI6dHJ1ZSwidmVyaWZpZWRLWUMiOiJub3QgdmVyaWZpZWQiLCJpYXQiOjE2ODgxODYzNDksImV4cCI6MTY5NTk2MjM0OX0.1cTRGhmK_0Uo3C5QLmGScbCHFjVXBl63wlBSI_iWZcY';

const accessTokenRichBalance =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDg4MTAxOWNmMGMyY2Y5ZDJhMDAwOTgiLCJyb2xlcyI6ImxlbmRlciIsInZlcmlmaWVkRW1haWwiOnRydWUsInZlcmlmaWVkS1lDIjoidmVyaWZpZWQiLCJpYXQiOjE2ODgwNTA1MDgsImV4cCI6MTY4ODY1NTMwOH0.MQ2V-lcOFE1xJvTf09KOsTfkq0LodAMSSoqM5mDp5f8';

describe('Balance ~ Positive Case', () => {
    test('GET /balance should return balance', async () => {
        const response = await axios.get(`${baseUrl}/api/balance`, {
            headers: {
                Authorization: `Bearer ${accessTokenRichBalance}`,
            },
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('balance');
    });

    test('POST /balance/account should add new bank account', async () => {
        const payload = {
            accountNumber: 2929328942,
            bankCode: 'bri',
            bankName: 'Bank Rakyat Indonesia',
        };

        const response = await axios.post(
            `${baseUrl}/api/balance/account`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenRichBalance}`,
                },
            },
        );

        expect(response.status).toBe(200);
    });

    test('GET /balance/account should return bank account data', async () => {
        const response = await axios.get(`${baseUrl}/api/balance/account`, {
            headers: {
                Authorization: `Bearer ${accessTokenRichBalance}`,
            },
        });

        expect(response.status).toBe(200);
        expect(response.data.data[0]).toHaveProperty('bankCode');
    });

    test('DELETE /balance/account should delete a bank account', async () => {
        const payload = {
            accountNumber: '2929328942',
        };

        const response = await axios.delete(`${baseUrl}/api/balance/account`, {
            data: payload,
            headers: {
                Authorization: `Bearer ${accessTokenRichBalance}`,
            },
        });

        expect(response.status).toBe(200);
    });

    test('POST /balance/deposit should topup balance', async () => {
        const payload = {
            amount: 50000,
        };

        // const response = await axios.post(
        //     `${baseUrl}/api/balance/deposit`,
        //     payload,
        //     {
        //         headers: {
        //             Authorization: `Bearer ${accessTokenRichBalance}`,
        //         },
        //     },
        // );

        // expect(response.status).toBe(200);
        // expect(response.data.data).toHaveProperty('paymentLink');
    }, 10000);

    test('POST /balance/withdraw should withdraw balance', async () => {
        const payload = {
            accountNumber: '55555677788',
            amount: 15000,
            bankCode: 'bri',
        };

        // const response = await axios.post(
        //     `${baseUrl}/api/balance/withdraw`,
        //     payload,
        //     {
        //         headers: {
        //             Authorization: `Bearer ${accessTokenRichBalance}`,
        //         },
        //     },
        // );

        // expect(response.status).toBe(200);
    }, 10000);

    test('GET /balance/transaction/history should return transaction history', async () => {
        const response = await axios.get(
            `${baseUrl}/api/balance/transaction/history`,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenRichBalance}`,
                },
            },
        );

        expect(response.status).toBe(200);
    });
});

describe('Balance ~ Negatif Case', () => {
    test('GET /balance should return 403 not log in', async () => {
        try {
            await axios.get(`${baseUrl}/api/balance`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /balance/account should return 403 not log in', async () => {
        try {
            const payload = {
                accountNumber: 2929328942,
                bankCode: 'bri',
                bankName: 'Bank Rakyat Indonesia',
            };

            const response = await axios.post(
                `${baseUrl}/api/balance/account`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /balance/account should return 422 invalid payload', async () => {
        try {
            const payload = {
                accountNumber: 2929328942,
                bankName: 'Bank Rakyat Indonesia',
            };

            const response = await axios.post(
                `${baseUrl}/api/balance/account`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('POST /balance/account should return 409 already exist', async () => {
        try {
            const payload = {
                accountNumber: 55555677788,
                bankName: 'Bank Rakyat Indonesia',
                bankCode: 'bri',
            };

            const response = await axios.post(
                `${baseUrl}/api/balance/account`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(409);
        }
    });

    test('GET /balance/account should return 403 not log in', async () => {
        try {
            const response = await axios.get(
                `${baseUrl}/api/balance/account`,
                {},
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('DELETE /balance/account should return 422 for invalid payload', async () => {
        try {
            const payload = {};

            const response = await axios.delete(
                `${baseUrl}/api/balance/account`,
                {
                    data: payload,
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('DELETE /balance/account should return 403 for not log in', async () => {
        try {
            const payload = {
                accountNumber: 55555677788,
            };

            const response = await axios.delete(
                `${baseUrl}/api/balance/account`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('DELETE /balance/account should return 404 for not found', async () => {
        try {
            const payload = {
                accountNumber: 11111111,
            };

            const response = await axios.delete(
                `${baseUrl}/api/balance/account`,
                {
                    data: payload,
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('POST /balance/deposit should return 403 not login', async () => {
        try {
            const payload = {
                amount: 50000,
            };

            const response = await axios.post(
                `${baseUrl}/api/balance/deposit`,
                {
                    data: payload,
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /balance/deposit should return 422 invalid payload', async () => {
        try {
            const payload = {};

            const response = await axios.post(
                `${baseUrl}/api/balance/deposit`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('POST /balance/withdraw should return 403 not log in', async () => {
        try {
            const payload = {
                accountNumber: '55555677788',
                amount: 15000,
                bankCode: 'bri',
            };

            const response = await axios.post(
                `${baseUrl}/api/balance/withdraw`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /balance/withdraw should return 422 invalid payload', async () => {
        try {
            const payload = {
                amount: 15000,
                bankCode: 'bri',
            };

            const response = await axios.post(
                `${baseUrl}/api/balance/withdraw`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('GET /balance/transaction/history should return 403 not log in', async () => {
        try {
            const response = await axios.get(
                `${baseUrl}/api/balance/transaction/history`,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });
});
