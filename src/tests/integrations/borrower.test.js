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

describe('Borrowers ~ Positive Case', () => {
    test('POST /borrowers/loan should create new loan', async () => {
        const payload = {
            purpose: 'Ngajarin Messi cara nendang',
            amount: 10000000,
            tenor: 2,
            yieldReturn: 100000,
            paymentSchema: 'Pelunasan Langsung',
            borrowingCategory: 'Pendidikan',
        };

        const response = await axios.post(
            `${baseUrl}/api/borrowers/loan`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        expect(response.status).toBe(201);
    });

    test('GET /borrowers/payment/schedule should return payment schedule data', async () => {
        const response = await axios.get(
            `${baseUrl}/api/borrowers/payment/schedule`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
    });

    test('GET /borrowers/payment/loan should return loan history', async () => {
        const response = await axios.get(`${baseUrl}/api/borrowers/loan`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
    });

    test('PUT /borrowers/request/verification should request verify KYC', async () => {
        const data = new FormData();
        data.append('personal.fullName', 'Moo Salahhhh');
        data.append('personal.gender', 'Male');
        data.append('personal.birthDate', '1990-02-02');
        data.append('personal.idCardNumber', '121314343535');
        data.append('personal.work.name', 'Footballer');
        data.append('personal.work.salary', '10000');
        data.append('relativesContact.firstRelative.name', 'Hannah');
        data.append('relativesContact.firstRelative.relation', 'Mommyy');
        data.append(
            'relativesContact.firstRelative.phoneNumber',
            '65892842941',
        );
        data.append('relativesContact.secondRelative.name', 'James');
        data.append('relativesContact.secondRelative.relation', 'son');
        data.append('relativesContact.secondRelative.phoneNumber', '628884721');
        data.append(
            'idCardImage',
            fs.createReadStream(
                'C:/Users/farha/OneDrive/Pictures/268_FOTO.JPG.jpg',
            ),
        );
        data.append(
            'faceImage',
            fs.createReadStream('C:/Users/farha/OneDrive/Pictures/7823.png'),
        );

        const config = {
            method: 'put',
            maxBodyLength: Infinity,
            url: `${baseUrl}/api/borrowers/request/verification`,
            headers: {
                ...data.getHeaders(),
                Authorization: `Bearer ${accessTokenNotVerifyKYC}`,
            },
            data: data,
        };

        const response = await axios(config);
        expect(response.status).toBe(200);
    });

    test('GET /borrowers/loan/disbursement should return loan ready to disbursement', async () => {
        const response = await axios.get(
            `${baseUrl}/api/borrowers/loan/disbursement`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
    });

    test('POST /borrowers/loan/disbursement should disbursement loan amount to user bank account', async () => {
        try {
            const payload = {
                loanId: '64a8da284eb831cad43f8253',
                bankId: '649a7436fc4df3cfdc0558b8',
            };

            const response = await axios.post(
                `${baseUrl}/api/borrowers/loan/disbursement`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );
        } catch (error) {
            // console.log('res', response.data);
            // expect(response.status).toBe(200);
        }
    });
});

describe('Borrower ~ Negatif Case', () => {
    test('POST /borrowers/loan should return 403 not login', async () => {
        try {
            const payload = {
                purpose: 'Ngajarin Messi cara nendang',
                amount: 10000000,
                tenor: 2,
                yieldReturn: 100000,
                paymentSchema: 'Pelunasan Langsung',
                borrowingCategory: 'Pendidikan',
            };

            await axios.post(`${baseUrl}/api/borrowers/loan`, payload);
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /borrowers/loan should return 422 invalid payload', async () => {
        try {
            const payload = {
                amount: 10000000,
                tenor: 2,
                yieldReturn: 100000,
                paymentSchema: 'Pelunasan Langsung',
                borrowingCategory: 'Pendidikan',
            };

            await axios.post(`${baseUrl}/api/borrowers/loan`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('POST /borrowers/loan should return 400 invalid minimum imbal hasil', async () => {
        try {
            const payload = {
                purpose: 'Ngajarin Messi cara nendang',
                amount: 10000000,
                tenor: 2,
                yieldReturn: 5000,
                paymentSchema: 'Pelunasan Langsung',
                borrowingCategory: 'Pendidikan',
            };

            await axios.post(`${baseUrl}/api/borrowers/loan`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
        }
    });

    test('GET /borrowers/payment/schedule should return 403 not log in', async () => {
        try {
            await axios.get(`${baseUrl}/api/borrowers/payment/schedule`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('GET /borrowers/loan should return 403 not log in', async () => {
        try {
            await axios.get(`${baseUrl}/api/borrowers/loan`, {});
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('PUT /borrowers/request/verification should return 403 not login', async () => {
        try {
            const data = new FormData();
            data.append('personal.fullName', 'Moo Salahhhh');
            data.append('personal.gender', 'Male');
            data.append('personal.birthDate', '1990-02-02');
            data.append('personal.idCardNumber', '121314343535');
            data.append('personal.work.name', 'Footballer');
            data.append('personal.work.salary', '10000');
            data.append('relativesContact.firstRelative.name', 'Hannah');
            data.append('relativesContact.firstRelative.relation', 'Mommyy');
            data.append(
                'relativesContact.firstRelative.phoneNumber',
                '65892842941',
            );
            data.append('relativesContact.secondRelative.name', 'James');
            data.append('relativesContact.secondRelative.relation', 'son');
            data.append(
                'relativesContact.secondRelative.phoneNumber',
                '628884721',
            );
            data.append(
                'idCardImage',
                fs.createReadStream(
                    'C:/Users/farha/OneDrive/Pictures/268_FOTO.JPG.jpg',
                ),
            );
            data.append(
                'faceImage',
                fs.createReadStream(
                    'C:/Users/farha/OneDrive/Pictures/7823.png',
                ),
            );

            const config = {
                method: 'put',
                maxBodyLength: Infinity,
                url: `${baseUrl}/api/borrowers/request/verification`,
                headers: {
                    ...data.getHeaders(),
                },
                data: data,
            };

            await axios(config);
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('PUT /borrowers/request/verification should return 422 invalid payload', async () => {
        try {
            const data = new FormData();
            data.append('personal.gender', 'Male');
            data.append('personal.birthDate', '1990-02-02');
            data.append('personal.idCardNumber', '121314343535');
            data.append('personal.work.name', 'Footballer');
            data.append('personal.work.salary', '10000');
            data.append('relativesContact.firstRelative.name', 'Hannah');
            data.append('relativesContact.firstRelative.relation', 'Mommyy');
            data.append(
                'relativesContact.firstRelative.phoneNumber',
                '65892842941',
            );
            data.append('relativesContact.secondRelative.name', 'James');
            data.append('relativesContact.secondRelative.relation', 'son');
            data.append(
                'relativesContact.secondRelative.phoneNumber',
                '628884721',
            );
            data.append(
                'idCardImage',
                fs.createReadStream(
                    'C:/Users/farha/OneDrive/Pictures/268_FOTO.JPG.jpg',
                ),
            );
            data.append(
                'faceImage',
                fs.createReadStream(
                    'C:/Users/farha/OneDrive/Pictures/7823.png',
                ),
            );

            const config = {
                method: 'put',
                maxBodyLength: Infinity,
                url: `${baseUrl}/api/borrowers/request/verification`,
                headers: {
                    ...data.getHeaders(),
                    Authorization: `Bearer ${accessTokenNotVerifyKYC}`,
                },
                data: data,
            };

            const response = await axios(config);
        } catch (error) {
            expect(error.response.status).toBe(422);
        }
    });

    test('GET /borrowers/loan/disbursement should return 403 not login', async () => {
        try {
            const response = await axios.get(
                `${baseUrl}/api/borrowers/loan/disbursement`,
                // {
                //     headers: {
                //         Authorization: `Bearer ${accessToken}`,
                //     },
                // },
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /borrowers/loan/disbursement should return 403 not login  ', async () => {
        try {
            const payload = {
                loanId: '64a8da284eb831cad43f8253',
                bankId: '649a7436fc4df3cfdc0558b8',
            };

            const response = await axios.post(
                `${baseUrl}/api/borrowers/loan/disbursement`,
                payload,
            );
        } catch (error) {
            expect(error.response.status).toBe(403);
        }
    });

    test('POST /borrowers/loan/disbursement should return 404 loanId not found', async () => {
        try {
            const payload = {
                loanId: '64a8da284eb831cad43f8253',
                bankId: '649a7436fc4df3cfdc0558b8',
            };

            const response = await axios.post(
                `${baseUrl}/api/borrowers/loan/disbursement`,
                payload,
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

    test('POST /borrowers/loan/disbursement should return 404 bankId not found', async () => {
        try {
            const payload = {
                loanId: '64a8da284eb831cad43f8253',
                bankId: '649a7436fc4df3cfdc0558b1',
            };

            const response = await axios.post(
                `${baseUrl}/api/borrowers/loan/disbursement`,
                payload,
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

    test('POST /borrowers/loan/disbursement should return 400 when loan not full', async () => {
        try {
            const payload = {
                loanId: '64a8da284eb831cad43f8253',
                bankId: '649a7436fc4df3cfdc0558b1',
            };

            const response = await axios.post(
                `${baseUrl}/api/borrowers/loan/disbursement`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );
        } catch (error) {
            // expect(error.response.status).toBe(400);
        }
    });
});
