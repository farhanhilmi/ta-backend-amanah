import workModels from '../../database/models/borrower/work.models.js';
import lenderModel from '../../database/models/lender/lender.model.js';

export default async (userId) => {
    try {
        if (await lenderModel.exists({ userId })) {
            return;
        }

        await lenderModel.create({ userId, status: 'not verified' });
        await workModels.create({
            userId: userId,
        });
    } catch (error) {
        throw error;
    }
};
