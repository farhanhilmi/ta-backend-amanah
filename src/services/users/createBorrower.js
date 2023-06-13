import borrowerModels from '../../database/models/borrower/borrower.models.js';
import workModels from '../../database/models/borrower/work.models.js';
import relativesModels from '../../database/models/borrower/relatives.models.js';
import { omit } from '../../utils/index.js';

export default async (userId) => {
    try {
        // Check if user already has a borrower account
        if (await borrowerModels.exists({ userId })) {
            return;
        }
        const borrowerData = {
            userId,
            loanLimit: null,
            income: null,
            status: 'not verified',
        };

        // Create borrower object data

        // create user relatives object data
        await Promise.allSettled([
            await borrowerModels.create(borrowerData),
            await workModels.create({
                userId: userId,
            }),
            await relativesModels.create({ userId }),
        ]);

        // const borrower = {
        //     ...newBorrower._doc,
        //     relatives: omit(relatives.value._doc, [
        //         '_id',
        //         '__v',
        //         'userId',
        //         'createdDate',
        //         'modifyDate',
        //     ]),
        //     work: work.value._doc,
        // };

        // delete Object.assign(borrower, { ['borrowerId']: borrower['_id'] })[
        //     '_id'
        // ];

        // return borrower;
    } catch (error) {
        throw error;
    }
};
