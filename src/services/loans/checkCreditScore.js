import axios from 'axios';
import config from '../../config/index.js';
import loansModels from '../../database/models/loan/loans.models.js';

const convertLoanPurpose = (item) => {
    const loanPurpose = {
        'Bisnis Kecil': 'small_business',
        'Tempat Tinggal': 'house',
        Kesehatan: 'medical',
        Kendaraan: 'car',
        'Pembelian Besar': 'major_purchase',
    };

    return loanPurpose[item] || 'other';
};

export default async ({
    loanId,
    homeownership,
    annual_income,
    debt_to_income,
    loan_purpose,
    loan_amount,
    term,
    interest_rate,
    // debtToIncome,
}) => {
    try {
        // const creditScore = await checkCreditScore({
        //     loanId: loanId,
        //     loan_amount: parseFloat(loan_amount),
        //     homeownership,
        //     loan_purpose,
        //     term,
        //     annual_income: parseFloat(annual_income),
        //     debt_to_income: parseFloat(debtToIncome),
        //     balance: parseFloat(loan_amount),
        //     inrest_rate: parseFloat(inrest_rate),
        // });

        const usdRate = 14994;
        console.log('homeownership', homeownership);
        const payload = [
            {
                loanId: loanId,
                loan_amount: parseFloat(`${loan_amount}`) / usdRate,
                homeownership: homeownership.toUpperCase(),
                loan_purpose: convertLoanPurpose(loan_purpose),
                term,
                annual_income: parseFloat(`${annual_income}`) / usdRate,
                debt_to_income: parseFloat(`${debt_to_income}`),
                balance: parseFloat(`${loan_amount}`) / usdRate,
                interest_rate: parseFloat(
                    `${parseInt(interest_rate) / parseInt(loan_amount)}`,
                ),
                // parseFloat(
                //     parseFloat(
                //         `${
                //             parseInt(loan_amount) /
                //             usdRate /
                //             (parseInt(interest_rate) / usdRate)
                //         }`,
                //     ).toFixed(1),
                // ),
            },
        ];
        console.log('payload', payload);
        const response = await axios.post(
            `${config.API_CREDIT_SCORE}/${loanId}`,
            payload,
        );
        console.log('response.data', response.data);

        await loansModels.findByIdAndUpdate(loanId, {
            creditScore: response.data.credit_score,
        });

        return response.data;
    } catch (error) {
        console.log('ERROR AT CREDIT SCORE', error);
    }
};
