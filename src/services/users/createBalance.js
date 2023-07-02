import balanceModel from '../../database/models/balance.model.js';
// import { createVA } from '../../utils/xendit.js';

export default async (userId, userName, roles) => {
    try {
        // const VA = [
        //     {
        //         externalID: 'adad',
        //         bankCode: 'BNI',
        //         name: userName,
        //     },
        // ];
        // if (roles === 'lender') {
        //     VA.push([
        //         {
        //             externalID: 'adad',
        //             bankCode: 'BRI',
        //             name: userName,
        //         },
        //         {
        //             externalID: 'adad',
        //             bankCode: 'BCA',
        //             name: userName,
        //         },
        //     ]);
        // }
        // await createVA(VA);

        await balanceModel.create({ userId });
    } catch (error) {
        throw error;
    }
};
