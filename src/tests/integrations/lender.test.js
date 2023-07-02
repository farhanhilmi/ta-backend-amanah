// import request from 'supertest';
import axios from 'axios';

const port = 8000; // Specify the port on which your Express.js application is running
const baseUrl = `http://localhost:${port}`; //

const accessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDg4MGRhOWNmMGMyY2Y5ZDJhMDAwNjAiLCJyb2xlcyI6ImxlbmRlciIsInZlcmlmaWVkRW1haWwiOnRydWUsInZlcmlmaWVkS1lDIjoidmVyaWZpZWQiLCJpYXQiOjE2ODgwNDQzMjMsImV4cCI6MTY4ODY0OTEyM30.LC6zCHfPRN5QHHulVHg4fabHyKm64xcJt61IqppvfJc';

const refreshToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDg4MGRhOWNmMGMyY2Y5ZDJhMDAwNjAiLCJyb2xlcyI6ImxlbmRlciIsInZlcmlmaWVkRW1haWwiOnRydWUsInZlcmlmaWVkS1lDIjoidmVyaWZpZWQiLCJpYXQiOjE2ODgwNDQzMjMsImV4cCI6MTY5MDYzNjMyM30.dhcc7YkXF4siftdk-QRyC6Lz53YwgFRxDTBIBGU8vv0';

const accessTokenRichBalance =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDg4MTAxOWNmMGMyY2Y5ZDJhMDAwOTgiLCJyb2xlcyI6ImxlbmRlciIsInZlcmlmaWVkRW1haWwiOnRydWUsInZlcmlmaWVkS1lDIjoidmVyaWZpZWQiLCJpYXQiOjE2ODgwNTA1MDgsImV4cCI6MTY4ODY1NTMwOH0.MQ2V-lcOFE1xJvTf09KOsTfkq0LodAMSSoqM5mDp5f8';

const refreshTokenRichBalance =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDg4MTAxOWNmMGMyY2Y5ZDJhMDAwOTgiLCJyb2xlcyI6ImxlbmRlciIsInZlcmlmaWVkRW1haWwiOnRydWUsInZlcmlmaWVkS1lDIjoidmVyaWZpZWQiLCJpYXQiOjE2ODgwNTA1MDgsImV4cCI6MTY5MDY0MjUwOH0.wtw5TZ2OEoUVUSzhFudTySE9GuPNsa5u71bRwSoO440';
describe('Lenders ~ Positive Case', () => {
    test('GET /lenders/profile should return lender data', async () => {
        const response = await axios.get(`${baseUrl}/api/lenders/profile`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('lenderId');
        expect(response.data.data.email).toBe('lender@yopmail.com');
    });

    test('POST /lenders/funding should funding a loan', async () => {
        const payload = {
            loanId: '6445ffa60cfd73ccc903961c',
            amount: 500000,
        };
        const response = await axios.post(
            `${baseUrl}/api/lenders/funding`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenRichBalance}`,
                },
            },
        );
        expect(response.status).toBe(201);
    });

    test('GET /lenders/profit should return lender"s profit', async () => {
        const response = await axios.get(`${baseUrl}/api/lenders/profit`, {
            headers: {
                Authorization: `Bearer ${accessTokenRichBalance}`,
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('totalYield');
        expect(response.data.data).toHaveProperty('totalFunding');
    });

    test('GET /lenders/funding should return lender"s portfolio', async () => {
        const response = await axios.get(`${baseUrl}/api/lenders/funding`, {
            headers: {
                Authorization: `Bearer ${accessTokenRichBalance}`,
            },
        });
        // console.log(response.data.data);
        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('active');
        expect(response.data.data).toHaveProperty('done');
    });

    test('POST /lenders/funding/auto should create auto lend', async () => {
        const payload = {
            tenorLength: {
                start: 10,
                end: 12,
            },
            yieldRange: {
                start: 50000,
                end: 350000,
            },
            borrowingCategory: ['personal', 'hiburan'],
            amountToLend: 1000000,
        };
        const response = await axios.post(
            `${baseUrl}/api/lenders/funding/auto`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenRichBalance}`,
                },
            },
        );
        expect(response.status).toBe(201);
        expect(response.data.message).toBe(
            'Auto Lend has been created. When the auto lend matches a loan, the loan will be automatically funded. We will send you a notification when this happens via your email.',
        );
    });

    test('PUT /lenders/request/verification should request verify kyc', async () => {
        try {
            const payload = {};
            const response = await axios.put(
                `${baseUrl}/api/lenders/request/verification`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessTokenRichBalance}`,
                    },
                },
            );
            expect(response.status).toBe(200);
        } catch (error) {}
    });
});

describe('Lenders ~ Negatif Case', () => {
    test('GET /lenders/profile should return 403 not login', async () => {
        try {
            await axios.get(`${baseUrl}/api/lenders/profile`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /lenders/funding should return 403 not login', async () => {
        try {
            const payload = {
                loanId: '6445ffa60cfd73ccc903961c',
                amount: 500000,
            };
            await axios.post(`${baseUrl}/api/lenders/funding`, payload);
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /lenders/funding should return 402 balance not enough', async () => {
        try {
            const payload = {
                loanId: '6445ffa60cfd73ccc903961c',
                amount: 500000,
            };
            await axios.post(`${baseUrl}/api/lenders/funding`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            expect(error.response.status).toBe(402);
            expect(error.response.data.message).toBe(
                "You don't have enough balance to fund this loan request. Please top up your balance before funding this loan request.",
            );
        }
    });

    test('POST /lenders/funding should return 404 not found', async () => {
        try {
            const payload = {
                loanId: '6445ffa60cfd73ccc903962c',
                amount: 500000,
            };
            await axios.post(`${baseUrl}/api/lenders/funding`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('POST /lenders/funding should return 404 loan not found', async () => {
        try {
            const payload = {
                loanId: '6445ffa60cfd73ccc903962c',
                amount: 500000,
            };
            await axios.post(`${baseUrl}/api/lenders/funding`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('POST /lenders/funding should return 422 payload invalid', async () => {
        try {
            const payload = {
                loanId: '6445ffa60cfd73ccc903962c',
            };
            await axios.post(`${baseUrl}/api/lenders/funding`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('GET /lenders/profit should return 403 not login', async () => {
        try {
            await axios.get(`${baseUrl}/api/lenders/profit`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('GET /lenders/funding should return 403 not login', async () => {
        try {
            const response = await axios.get(
                `${baseUrl}/api/lenders/funding`,
                {},
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /lenders/funding/auto should return 403 for not login', async () => {
        try {
            const payload = {
                tenorLength: {
                    start: 10,
                    end: 12,
                },
                yieldRange: {
                    start: 50000,
                    end: 350000,
                },
                borrowingCategory: ['personal', 'hiburan'],
                amountToLend: 1000000,
            };
            const response = await axios.post(
                `${baseUrl}/api/lenders/funding/auto`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /lenders/funding/auto should return 422 for invalid payload', async () => {
        try {
            const payload = {
                tenorLength: {
                    start: 10,
                    end: 12,
                },
                yieldRange: {
                    start: 50000,
                    end: 350000,
                },
                borrowingCategory: ['personal', 'hiburan'],
            };
            const response = await axios.post(
                `${baseUrl}/api/lenders/funding/auto`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('PUT /lenders/request/verification should return 403 not log in', async () => {
        try {
            const payload = {};
            const response = await axios.put(
                `${baseUrl}/api/lenders/request/verification`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('PUT /lenders/request/verification should return 422 payload invalid', async () => {
        try {
            const payload = {};

            const config = {
                method: 'put',
                maxBodyLength: Infinity,
                url: `${baseUrl}/api/lenders/request/verification`,
                headers: {
                    ...data.getHeaders(),
                    Authorization: `Bearer ${accessTokenRichBalance}`,
                },
                data: payload,
            };

            const response = await axios(config);
        } catch (error) {
            // expect(error.response.status).toBe(422);
        }
    });
});
