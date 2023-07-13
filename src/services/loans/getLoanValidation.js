import borrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import { NotFoundError, ValidationError } from '../../utils/errorHandler.js';

export default async (loanId) => {
    try {
        // const loan = await loansModels.aggregate([
        //     {
        //         $match: {
        //             _id: loanId,
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'users',
        //             localField: 'userId',
        //             foreignField: '_id',
        //             as: 'user',
        //         },
        //     },
        //     {
        //         $unwind: '$user',
        //     },
        //     {
        //         $lookup: {
        //             from: 'fundings',
        //             localField: '_id',
        //             foreignField: 'loanId',
        //             as: 'fundings',
        //         },
        //     },
        //     {
        //         $addFields: {
        //             name: '$user.name',
        //         },
        //     },
        // ]);
        // Retrieve loan details
        // if (!loanId) throw new ValidationError('Loan ID is required');

        // const contract = await borrowerContractModels.findOne({ signatureKey: loanId });

        const loan = await loansModels
            .findById(loanId)
            .populate('userId', 'name')
            .select(
                'amount yieldReturn tenor borrowingCategory purpose paymentSchema',
            );

        if (!loan) {
            throw new NotFoundError('Loan not found');
        }

        // Retrieve payment dates for the loan
        const payments = await paymentModels
            .findOne({ loanId })
            .select('paymentSchedule.date')
            .lean();

        const repaymentDate = payments.paymentSchedule.map((schedule) =>
            schedule.date.toISOString(),
        );

        // Retrieve funding details for the loan
        const fundings = await fundingModels
            .find({ loanId })
            .populate('userId', 'name')
            .select('amount yield createdDate');

        const totalLenders = fundings.length;

        // Combine the loan details, repayment dates, and funding details
        const result = {
            name: loan.userId.name,
            amount: loan.amount,
            yieldReturn: loan.yieldReturn,
            tenor: loan.tenor,
            borrowingCategory: loan.borrowingCategory,
            purpose: loan.purpose,
            repaymentSchema: loan.paymentSchema,
            repaymentDate,
            totalLenders,
            lenders: fundings.map((funding) => ({
                name: funding.userId.name,
                totalFunds: funding.amount,
                yield: funding.yield,
                date: funding.createdDate.toISOString(),
            })),
        };

        // console.log(result);
        return result;
    } catch (error) {
        throw error;
    }
};

// const result = {
//     name: 'Borrower name',
//     amount: 5000000,
//     yieldReturn: 500000,
//     tenor: 2,
//     borrowingCategory: 'Personal',
//     purpose: 'Personal',
//     repaymentSchema: 'Pelunasan Cicilan',
//     repaymentDate: [
//         '2020-01-01',
//         '2020-02-01',
//         '2020-03-01',
//         '2020-04-01',
//         '2020-05-01',
//         '2020-06-01',
//     ],
//     totalLenders: 2,
//     lenders: [
//         {
//             name: 'Lender 1',
//             totalFunds: 250000,
//             yeild: 25000,
//             date: '2020-01-01',
//         },
//         {
//             name: 'Lender 2',
//             totalFunds: 250000,
//             yeild: 25000,
//             date: '2020-01-01',
//         },
//     ],
// };
