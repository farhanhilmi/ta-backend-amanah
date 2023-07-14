import config from '../../config/index.js';
import balanceModel from '../../database/models/balance.model.js';
import lenderModel from '../../database/models/lender/lender.model.js';
import autoLendModels from '../../database/models/loan/autoLend.models.js';
import borrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
// import BorrowerContractModels from '../../database/models/loan/BorrowerContract.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import usersModel from '../../database/models/users.model.js';
import { ValidationError } from '../../utils/errorHandler.js';
import {
    getCurrentJakartaTime,
    toObjectId,
    validateRequestPayload,
} from '../../utils/index.js';
import lenderSignature from '../../utils/lenderSignature.js';
import { sendLoanFullyFunded } from '../mail/sendMail.js';
// import borrowerContract from '../../database/models/loan/borrowerContract.models.js';

export default async (payload) => {
    try {
        const errors = validateRequestPayload(payload, ['loanId', 'rating']);
        if (errors.length > 0) {
            throw new ValidationError(`${errors} field(s) is required`);
        }
        const { loanId, rating } = payload;

        const loan = await loansModels.findByIdAndUpdate(loanId, {
            status: 'on request',
            creditScore: rating,
        });

        // ?CHECK IF AUTO LEND DATA MATCH WITH THIS LOAN
        const autoLends = await autoLendModels.find({
            borrowingCategory: {
                $regex: new RegExp(loan.borrowingCategory, 'i'),
            },
            status: 'waiting',
            'tenorLength.start': {
                $lte: parseInt(loan.tenor),
            },
            'tenorLength.end': {
                $gte: parseInt(loan.tenor),
            },
            'yieldRange.start': {
                $lte: parseInt(loan.yieldReturn),
            },
            'yieldRange.end': {
                $gte: parseInt(loan.yieldReturn),
            },
        });

        if (autoLends.length > 0) {
            const funding = autoLends[0];
            // const loanData = loan.value;
            let isMatch = false;
            // if (loanData.amount)
            const totalFunds = await fundingModels.aggregate([
                {
                    $match: {
                        loanId: loan._id,
                    },
                },
                {
                    $group: {
                        _id: '$loanId',
                        totalFunds: {
                            $sum: '$amount',
                        },
                    },
                },
            ]);

            let currentTotalFunds = !totalFunds[0]?.totalFunds
                ? 0
                : totalFunds[0]?.totalFunds;

            for (let i = 0; i < autoLends.length; i++) {
                currentTotalFunds =
                    currentTotalFunds + autoLends[i].amountToLend;

                if (currentTotalFunds > loan.amount) {
                    continue;
                    // throw new RequestError(
                    //     "You can't fund more than the available loan amount.",
                    // );
                }

                const lender = await lenderModel.findOne({
                    userId: funding.userId,
                });

                const yieldReturn =
                    loan.yieldReturn * (funding.amountToLend / loan.amount);

                const newFunding = await fundingModels.create({
                    userId: funding.userId,
                    lenderId: lender._id,
                    loanId: loan._id,
                    amount: funding.amountToLend,
                    yield: yieldReturn,
                });
                console.log('newFunding', newFunding);

                if (currentTotalFunds === loan.amount) {
                    loan.status = 'in borrowing';
                    isMatch = true;
                    const paymentSchedule = [];
                    const paymentDate = new Date(getCurrentJakartaTime());
                    const totalBill =
                        loan.amount +
                        loan.yieldReturn +
                        parseInt(config.TAX_AMOUNT_APP);
                    if (loan.paymentSchema === 'Pelunasan Cicilan') {
                        let paymentDateIncrement = 0;

                        const monthlyPayment = Math.floor(
                            totalBill / loan.tenor,
                        ); // Calculate the integer part of the monthly payment
                        const lastMonthPayment =
                            totalBill - monthlyPayment * (loan.tenor - 1); // Calculate the payment for the last month
                        for (let i = 0; i < loan.tenor - 1; i++) {
                            paymentDateIncrement += 30;
                            // const loanAmount =
                            //     (loan.amount + loan.yieldReturn) / loan.tenor;
                            paymentSchedule.push({
                                amount: monthlyPayment,
                                date: paymentDate.setDate(
                                    paymentDate.getDate() +
                                        paymentDateIncrement,
                                ),
                            });
                        }
                        paymentSchedule.push({
                            amount: lastMonthPayment,
                            date: paymentDate.setDate(
                                paymentDate.getDate() +
                                    paymentDateIncrement +
                                    30,
                            ),
                        });
                        // await this.paymentModel.create({
                        //     loanId: loan._id,
                        //     paymentSchedule,
                        // });
                    } else {
                        paymentSchedule.push({
                            amount: totalBill,
                            date: paymentDate.setDate(
                                paymentDate.getDate() + loan.tenor * 30,
                            ),
                        });
                    }

                    await paymentModels.create({
                        loanId: loan._id,
                        status: 'in borrowing',
                        paymentSchedule,
                    });

                    const [borrowerContract, borrowerUser] =
                        await Promise.allSettled([
                            borrowerContractModels.findOne(
                                { loanId: loan._id },
                                { contractLink: 1, _id: 0 },
                            ),
                            usersModel.findOne(
                                { _id: loan.userId },
                                { name: 1, email: 1, _id: 0 },
                            ),
                        ]);
                    const dashboardLink =
                        'https://amanahsyariah.vercel.app/lender';
                    // console.log('borrowerUser', borrowerUser);
                    const borrower = {
                        name: borrowerUser.value.name,
                        email: borrowerUser.value.email,
                    };
                    // console.log('contractLink', borrowerContract.value);
                    sendLoanFullyFunded(
                        borrower,
                        loan,
                        dashboardLink,
                        borrowerContract.value.contractLink,
                    );
                } else {
                    loan.status = 'on process';
                    isMatch = true;
                }

                // Update balance for lender and borrower
                const [unused1, unused2, contractLink] =
                    await Promise.allSettled([
                        balanceModel.findOneAndUpdate(
                            {
                                userId: lender.userId,
                            },
                            {
                                $inc: {
                                    amount: -parseInt(funding.amountToLend),
                                },
                            },
                        ),
                        balanceModel.findOneAndUpdate(
                            {
                                userId: loan.userId,
                            },
                            {
                                $inc: {
                                    amount: parseInt(funding.amountToLend),
                                },
                            },
                        ),
                        lenderSignature({
                            loanId: loan._id.toString(),
                            userId: lender.userId,
                            lenderId: lender._id.toString(),
                            borrowerId: loan.borrowerId,
                        }),
                    ]);

                break;
            }
            funding.status = isMatch ? 'matched' : 'waiting';
            funding.save();

            // loan.value.status = 'on request';
            loan.save();
        }

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
