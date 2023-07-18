import config from '../../config/index.js';
import balanceModel from '../../database/models/balance.model.js';
import borrowerModels from '../../database/models/borrower/borrower.models.js';
import workModels from '../../database/models/borrower/work.models.js';
import lenderModel from '../../database/models/lender/lender.model.js';
import autoLendModels from '../../database/models/loan/autoLend.models.js';
import borrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
// import BorrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
// import BorrowerContractModels from '../../database/models/loan/BorrowerContract.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import usersModel from '../../database/models/users.model.js';
import { getCurrentJakartaTime, toObjectId } from '../../utils/index.js';
import lenderSignature from '../../utils/lenderSignature.js';
import {
    generateContractPDF,
    generateQrImage,
    generateSignature,
} from '../../utils/signature.js';
import { sendLoanFullyFunded } from '../mail/sendMail.js';
import checkCreditScore from './checkCreditScore.js';
// import borrowerContract from '../../database/models/loan/borrowerContract.models.js';

export default async (payload) => {
    try {
        const data = {
            userId: payload.user.userId,
            borrowerId: payload.user.borrowerId,
            purpose: payload.loanApplication.purpose,
            amount: payload.loanApplication.amount,
            tenor: payload.loanApplication.tenor,
            productLink: payload.loanApplication.productLink,
            yieldReturn: payload.loanApplication.yieldReturn,
            paymentSchema: payload.loanApplication.paymentSchema,
            borrowingCategory: payload.loanApplication.borrowingCategory,
        };
        const [loan, user, work, borrower] = await Promise.allSettled([
            await loansModels.create(data),
            await usersModel.findOne({ _id: toObjectId(data.userId) }),
            await workModels.findOne({ userId: toObjectId(data.userId) }),
            await borrowerModels.findOne({ userId: toObjectId(data.userId) }),
        ]);

        const debtToIncome =
            parseInt(work.value.salary) /
            14994 /
            (borrower.value.totalMonthlyDebt / 14994);

        checkCreditScore({
            loanId: loan.value._id.toString(),
            loan_amount: data.amount,
            homeownership: borrower.value.homeOwnershipType,
            loan_purpose: data.borrowingCategory,
            term: data.tenor,
            annual_income: work.value.annualIncome,
            debt_to_income: debtToIncome,
            interest_rate: data.yieldReturn,
        });

        // loan.value.creditScore = creditScore;
        // loan.value.save();

        // console.log('new loan', loan.value);

        const signatureKey = generateSignature({
            loanId: loan.value._id.toString(),
            borrowerId: data.borrowerId.toString(),
        });

        // SdTMgpTajpz+JEPAMIFMF4mzlhIrGDRQ1NvpGzO7oXK0wNCSSbJxuCnchrdBc9fEW7ljyJfBkFkQFIkQ33RiC9fKevfZW+p1AeDo3/lqbsC53tA5wmdTb+O7DzXGr7KSEkNItDVcL1gRRKC9bsnFi5nPGXLkkdaECJ6pPPseVYc/L8ut/0/zDsoRjX7mJBQOTAVxzOP861QD2RBkPvSGxI8kONAqBtcfDzamSklTt+1afk1urrhbH1ppaO0jRvAf/Jv3Em39uli1ehwZLZSkosRYdQNct8dhiAjJF8wiMWQz3BIcd7geoWa2KU0Q6OgMyhUIsUW4bi1rVRfh/DyQnQ==
        const qrData = `${
            config.CLIENT_REACT_APP_HOST
        }/contract/validation/${loan.value._id.toString()}}`;
        const qrImage = await generateQrImage(qrData);
        const pdfLink = await generateContractPDF({
            userId: data.userId,
            loanId: loan.value._id.toString(),
            borrowerName: user.value.name,
            // borrowerAddress: borrower.address,
            borrowerEmail: user.value.email,
            borrowerPhone: user.value.phoneNumber,
            loanYield: data.yieldReturn,
            loanAmount: data.amount,
            loanTenor: data.tenor,
            paymentSchema: data.paymentSchema,
            qrImage,
        });

        // await loan.updateOne({ contractLink: pdfLink }).exec();
        // loan.save();
        await borrowerContractModels.create({
            borrowerId: data.borrowerId,
            loanId: loan.value._id,
            signatureKey,
            contractLink: pdfLink,
        });

        // ?CHECK IF AUTO LEND DATA MATCH WITH THIS LOAN
        const autoLends = await autoLendModels.find({
            borrowingCategory: {
                $regex: new RegExp(loan.value.borrowingCategory, 'i'),
            },
            status: 'waiting',
            'tenorLength.start': {
                $lte: parseInt(loan.value.tenor),
            },
            'tenorLength.end': {
                $gte: parseInt(loan.value.tenor),
            },
            'yieldRange.start': {
                $lte: parseInt(loan.value.yieldReturn),
            },
            'yieldRange.end': {
                $gte: parseInt(loan.value.yieldReturn),
            },
        });

        if (autoLends.length > 0) {
            const funding = autoLends[0];
            const loanData = loan.value;
            let isMatch = false;
            // if (loanData.amount)
            const totalFunds = await fundingModels.aggregate([
                {
                    $match: {
                        loanId: loanData._id,
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

            let currentTotalFunds = !funding?.totalFunds
                ? 0
                : funding?.totalFunds;

            for (let i = 0; i < autoLends.length; i++) {
                // currentTotalFunds =
                //     currentTotalFunds + autoLends[i].amountToLend;

                // if (currentTotalFunds > loanData.amount) {
                //     continue;
                //     // throw new RequestError(
                //     //     "You can't fund more than the available loan amount.",
                //     // );
                // }
                if (loanData.amount > autoLends[i].amountToLend) {
                    continue;
                }
                console.log('currentTotalFunds', currentTotalFunds);

                let fundsRemaining = 0;

                if (funding.amountToLend > currentTotalFunds) {
                    fundsRemaining = funding.amountToLend - loanData.amount;
                }

                const lender = await lenderModel.findOne({
                    userId: funding.userId,
                });

                const yieldReturn =
                    loanData.yieldReturn *
                    (funding.amountToLend / loanData.amount);

                const newFunding = await fundingModels.create({
                    userId: funding.userId,
                    lenderId: lender._id,
                    loanId: loanData._id,
                    amount: funding.amountToLend - fundsRemaining,
                    yield: yieldReturn,
                });
                isMatch = true;

                console.log('newFunding', newFunding);
                currentTotalFunds = funding.amountToLend - fundsRemaining;

                if (currentTotalFunds === loanData.amount) {
                    loanData.status = 'in borrowing';
                    const paymentSchedule = [];
                    const paymentDate = new Date(getCurrentJakartaTime());
                    const totalBill =
                        loanData.amount +
                        loanData.yieldReturn +
                        parseInt(config.TAX_AMOUNT_APP);
                    if (loanData.paymentSchema === 'Pelunasan Cicilan') {
                        let paymentDateIncrement = 0;

                        const monthlyPayment = Math.floor(
                            totalBill / loanData.tenor,
                        ); // Calculate the integer part of the monthly payment
                        const lastMonthPayment =
                            totalBill - monthlyPayment * (loanData.tenor - 1); // Calculate the payment for the last month
                        for (let i = 0; i < loanData.tenor - 1; i++) {
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
                                paymentDate.getDate() + loanData.tenor * 30,
                            ),
                        });
                    }

                    await paymentModels.create({
                        loanId: loanData._id,
                        status: 'in borrowing',
                        paymentSchedule,
                    });

                    const [borrowerContract, borrowerUser] =
                        await Promise.allSettled([
                            borrowerContractModels.findOne(
                                { loanId: loanData._id },
                                { contractLink: 1, _id: 0 },
                            ),
                            usersModel.findOne(
                                { _id: loanData.userId },
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
                        loanData,
                        dashboardLink,
                        borrowerContract.value.contractLink,
                    );
                } else {
                    loanData.status = 'on process';
                    // isMatch = true;
                }

                const balanceFund = funding.amountToLend - fundsRemaining;

                if (fundsRemaining > 0) {
                    await balanceModel.findOneAndUpdate(
                        {
                            userId: lender.userId,
                        },
                        {
                            $inc: {
                                amount: parseInt(
                                    funding.amountToLend - currentTotalFunds,
                                ),
                            },
                        },
                    );
                }

                // Update balance for lender and borrower
                const [unused2, contractLink] = await Promise.allSettled([
                    // balanceModel.findOneAndUpdate(
                    //     {
                    //         userId: lender.userId,
                    //     },
                    //     {
                    //         $inc: {
                    //             amount: -parseInt(balanceFund),
                    //         },
                    //     },
                    // ),
                    balanceModel.findOneAndUpdate(
                        {
                            userId: loanData.userId,
                        },
                        {
                            $inc: {
                                amount: parseInt(currentTotalFunds),
                            },
                        },
                    ),
                    lenderSignature({
                        loanId: loanData._id.toString(),
                        userId: lender.userId,
                        lenderId: lender._id.toString(),
                        borrowerId: loanData.borrowerId,
                    }),
                ]);

                break;
            }
            funding.status = isMatch ? 'matched' : 'waiting';
            funding.save();

            // loan.value.status = 'on request';
            loanData.save();
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
