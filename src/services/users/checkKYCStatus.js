import borrowerModels from '../../database/models/borrower/borrower.models.js';
import lenderModel from '../../database/models/lender/lender.model.js';
import usersModel from '../../database/models/users.model.js';
import { NotFoundError, RequestError } from '../../utils/errorHandler.js';

export default async (userId, roles) => {
    const user = await usersModel.findOne({ _id: userId });
    if (!user) {
        throw new NotFoundError('User not found');
    }

    if (roles?.toLowerCase() === 'lender') {
        const lender = await lenderModel.findOne({ userId }, { status: 1 });
        return { kyc: lender.status, email: user.verified };
    } else if (roles?.toLowerCase() === 'borrower') {
        const borrower = await borrowerModels.findOne(
            { userId },
            { status: 1 },
        );
        return { kyc: borrower.status, email: user.verified };
    }

    throw new RequestError('Invalid user role');
};
