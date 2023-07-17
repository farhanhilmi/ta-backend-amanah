import axios from 'axios';
import config from '../../config/index.js';

export default async ({
    loanId,
    homeownership,
    annual_income,
    debt_to_income,
    loan_purpose,
    loan_amount,
    balance,
    term,
    inrest_rate,
}) => {
    try {
        const response = await axios.post(config.API_CREDIT_SCORE, {
            loanId,
            homeownership,
            annual_income,
            debt_to_income,
            loan_purpose,
            loan_amount,
            balance,
            term,
            inrest_rate,
        });

        console.log('response.data', response.data);
        return response.data;
    } catch (error) {
        throw error;
    }
};
