import BorrowerContractModels from '../../database/models/loan/BorrowerContract.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import usersModel from '../../database/models/users.model.js';
import { toObjectId } from '../../utils/index.js';
import {
    generateContractPDF,
    generateQrImage,
    generateSignature,
} from '../../utils/signature.js';
// import borrowerContract from '../../database/models/loan/borrowerContract.models.js';

export default async (payload) => {
    try {
        const data = {
            userId: payload.user.userId,
            borrowerId: payload.user.borrowerId,
            purpose: payload.loanApplication.purpose,
            amount: payload.loanApplication.amount,
            tenor: payload.loanApplication.tenor,
            yieldReturn: payload.loanApplication.yieldReturn,
            paymentSchema: payload.loanApplication.paymentSchema,
            borrowingCategory: payload.loanApplication.borrowingCategory,
        };

        const [loan, borrower] = await Promise.allSettled([
            await loansModels.create(data),
            await usersModel.findOne({ _id: toObjectId(data.userId) }),
        ]);

        console.log('new loan', loan.value);

        const signatureKey = generateSignature({
            loanId: loan.value._id.toString(),
            borrowerId: data.borrowerId.toString(),
        });

        const qrData =
            'https://www.google.com/search?q=ini+isi+halaman+validasi+contract.&oq=ini+isi+halaman+validasi+contract.&aqs=edge..69i57.30981j0j1&sourceid=chrome&ie=UTF-8';
        const qrImage = await generateQrImage(qrData);
        const pdfLink = await generateContractPDF({
            borrowerName: borrower.value.name,
            // borrowerAddress: borrower.address,
            borrowerEmail: borrower.value.email,
            borrowerPhone: borrower.value.phoneNumber,
            loanYield: data.yieldReturn,
            loanAmount: data.amount,
            loanTenor: data.tenor,
            paymentSchema: data.paymentSchema,
            qrImage,
        });

        // await loan.updateOne({ contractLink: pdfLink }).exec();
        // loan.save();
        await BorrowerContractModels.create({
            borrowerId: data.borrowerId,
            loanId: loan.value._id,
            signatureKey,
            contractLink: pdfLink,
        });
        // deleteCache(true, 'availableLoans-*');
        // PublishMessage(messageData, 'UPDATE_BORROWER_STATUS', 'Borrower');

        // const notifMessage = {
        //     event: 'LOAN_REQUEST',
        //     data: { userId: payload.user.userId, loanId: loan.value._id },
        //     message:
        //         'Your loan request has been successfully displayed and lenders can view your loan.',
        // };

        // io.emit(`notification#${payload.user.userId}`, notifMessage);
        return true;
    } catch (error) {
        console.log('error at create loan', error);
        throw error;
    }
};
