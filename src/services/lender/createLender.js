import lenderModel from '../../database/models/lender/lender.model.js';

export default async (userId) => {
    try {
        await lenderModel.create({ userId });
    } catch (error) {
        throw error;
    }
};
