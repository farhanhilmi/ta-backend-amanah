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

describe('Loans ~ Positive Case', () => {
    test('GET /loans/available should return available loans', async () => {
        const response = await axios.get(`${baseUrl}/api/loans/available`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        // console.log('response', response.data);
        expect(response.status).toBe(200);
        expect(response.data.data[0]).toHaveProperty('loanId');
        expect(response.data.meta.totalItems).toBeGreaterThanOrEqual(1);
    });

    test('GET /loans/available/{loanId} should return detail loans', async () => {
        const response = await axios.get(
            `${baseUrl}/api/loans/available/6445ffa60cfd73ccc903961c`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
        expect(response.status).toBe(200);
        expect(response.data.data.borrowingCategory).toBe('Pendidikan');
    });

    test('GET /loans/available/recommended should return recommended loans', async () => {
        const response = await axios.get(
            `${baseUrl}/api/loans/available/recommended`,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenRichBalance}`,
                },
            },
        );
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
    });
});

describe('Loans ~ Negatif Case', () => {
    test('GET /loans/available/{loanId} should return 404 loan not found', async () => {
        try {
            await axios.get(
                `${baseUrl}/api/loans/available/6445ffa60cfd73ccc903962c`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('GET /loans/available/recommended should return 403 not login', async () => {
        try {
            await axios.get(`${baseUrl}/api/loans/available/recommended`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });
});
