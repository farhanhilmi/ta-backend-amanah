import config from '../../config/index.js';
import autoLendModels from '../../database/models/loan/autoLend.models.js';
import borrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
import BorrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
// import BorrowerContractModels from '../../database/models/loan/BorrowerContract.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import usersModel from '../../database/models/users.model.js';
import { getCurrentJakartaTime, toObjectId } from '../../utils/index.js';
import {
    generateContractPDF,
    generateQrImage,
    generateSignature,
} from '../../utils/signature.js';
import { sendLoanFullyFunded } from '../mail/sendMail.js';
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
            userId: data.userId,
            loanId: loan.value._id.toString(),
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

        // ?CHECK IF AUTO LEND DATA MATCH WITH THIS LOAN
        const autoLends = await autoLendModels.find({
            borrowingCategory: {
                $regex: new RegExp(data.borrowingCategory, 'i'),
            },
            status: 'waiting',
            'tenorLength.start': {
                $lte: parseInt(data.tenor),
            },
            'tenorLength.end': {
                $gte: parseInt(data.tenor),
            },
            'yieldRange.start': {
                $lte: parseInt(data.yieldReturn),
            },
            'yieldRange.end': {
                $gte: parseInt(data.yieldReturn),
            },
        });

        if (autoLends.length > 0) {
            const funding = autoLends[0];
            const loanData = loan.value;
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

                if (currentTotalFunds === loan.amount) {
                    loan.status = 'in borrowing';
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
                    await paymentModel.create({
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
                }
                break;
            }

            loan.value.status = '';
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
