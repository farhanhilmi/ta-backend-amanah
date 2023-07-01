// import request from 'supertest';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const port = 8000; // Specify the port on which your Express.js application is running
const baseUrl = `http://localhost:${port}/api/admin`; //

const accessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDlmOTQ5OWYzZjc1NGNiODRkMDA1ZTUiLCJyb2xlcyI6ImFkbWluIiwidmVyaWZpZWRFbWFpbCI6dHJ1ZSwidmVyaWZpZWRLWUMiOmZhbHNlLCJpYXQiOjE2ODgxOTgxMDQsImV4cCI6MTY5NTk3NDEwNH0.z5JTKrIxhYjVSGOKJ-RWRtA3oSSPgLfZt8KBK0dGJmo';

describe('Admin ~ Positive Case', () => {
    test('GET /admin/users/kyc should return all kyc request', async () => {
        const response = await axios.get(`${baseUrl}/users/kyc`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
    });

    test('POST /admin/users/kyc should approve / reject verification request', async () => {
        const payload = {
            userId: '649fada43016797da5147e94',
            status: 'approved', // approved or rejected
            message: '', // OPTIONAL message to user if status reject
        };
        const response = await axios.post(`${baseUrl}/users/kyc`, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
    });

    test('GET /admin/users should return all users data', async () => {
        const response = await axios.get(`${baseUrl}/users`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.data.length).toBeGreaterThanOrEqual(1);
    });

    test('GET /admin/users/loans should return all users data', async () => {
        const response = await axios.get(`${baseUrl}/loans`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.data.length).toBeGreaterThanOrEqual(1);
    });

    test('GET /admin/fundings should return all fundings data', async () => {
        const response = await axios.get(`${baseUrl}/fundings`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
    });

    test('GET /admin/counts should return total data and total amount of loans, fundings', async () => {
        const response = await axios.get(`${baseUrl}/counts`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('loans');
        expect(response.data.data).toHaveProperty('fundings');
        expect(response.data.data).toHaveProperty('totalFunding');
        expect(response.data.data).toHaveProperty('totalLoans');
    });

    test('GET /admin/counts/transaction should return most lending and borrowed', async () => {
        const response = await axios.get(`${baseUrl}/counts/transaction`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('borrower');
        expect(response.data.data).toHaveProperty('lender');
    });

    test('GET /admin/loans/category/counts should return most loan categories', async () => {
        const response = await axios.get(`${baseUrl}/loans/category/counts`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
    });

    test('GET /admin/loans/funding/auto should return all auto lend data', async () => {
        const response = await axios.get(`${baseUrl}/loans/funding/auto`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
    });
});

describe('Admin ~ Negatif Case', () => {
    test('GET /admin/users/kyc should return 403 not log in', async () => {
        try {
            const response = await axios.get(`${baseUrl}/users/kyc`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /admin/users/kyc should return 403 not log in', async () => {
        try {
            const payload = {
                userId: '649fada43016797da5147e94',
                status: 'approved', // approved or rejected
                message: '', // OPTIONAL message to user if status reject
            };
            const response = await axios.post(
                `${baseUrl}/users/kyc`,
                payload,
                {},
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('GET /admin/users should return 403 not log in', async () => {
        try {
            const response = await axios.get(`${baseUrl}/users`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('GET /admin/users/loans should return 403 not log in', async () => {
        try {
            const response = await axios.get(`${baseUrl}/loans`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('GET /admin/fundings should return 403 not log in', async () => {
        try {
            const response = await axios.get(`${baseUrl}/fundings`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('GET /admin/loans/funding/auto should return 403 not log in', async () => {
        try {
            const response = await axios.get(
                `${baseUrl}/loans/funding/auto`,
                {},
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });
});
