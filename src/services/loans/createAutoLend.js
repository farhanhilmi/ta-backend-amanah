import config from '../../config/index.js';
import balanceModel from '../../database/models/balance.model.js';
import lenderModel from '../../database/models/lender/lender.model.js';
import autoLendModels from '../../database/models/loan/autoLend.models.js';
import borrowerContractModels from '../../database/models/loan/borrowerContract.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import usersModel from '../../database/models/users.model.js';
import { getCurrentJakartaTime, toTitleCase } from '../../utils/index.js';
import lenderSignature from '../../utils/lenderSignature.js';
import {
    generateContractPDF,
    generateQrImage,
    generateSignature,
} from '../../utils/signature.js';
import { sendLoanFullyFunded } from '../mail/sendMail.js';

export default async (payload) => {
    try {
        let {
            userId,
            tenorLength,
            borrowingCategory, // array of borrowing category e.g ['personal', 'business']
            yieldRange, // kisaran imbal hasil. e.g ['50000','100000']
            amountToLend, // jumlah yang akan dipinjamkan. e.g '100000'
        } = payload;

        // const adad = ['personal', 'business']; // OK BISA
        borrowingCategory = borrowingCategory.map((item) => toTitleCase(item));
        const matchQuery = {
            yieldReturn: {
                $gte: yieldRange.start,
                $lte: yieldRange.end,
            },
            tenor: {
                $gte: parseInt(tenorLength.start),
                $lte: parseInt(tenorLength.end),
            },
            borrowingCategory: {
                $in: borrowingCategory,
            },
        };

        // matchQuery['interestRate'] = {
        //     $gte: yieldRangeStart,
        //     $lte: yieldRangeEnd,
        // };

        // if (tenor) {
        //     matchQuery['tenor'] = {
        //         $gte: tenorLengthStart,
        //         $lte: tenorLengthEnd,
        //     };
        // }
        // matchQuery['borrowingCategory'] = {
        //     $in: borrowingCategory,
        // };

        // matchQuery['status'] = {
        //     $and: ['repayment', 'late repayment'],
        // };

        // console.log('matchQuery', matchQuery);
        const statusMatchQuery = [
            { status: 'on request' },
            { status: 'on process' },
        ];
        const loans = await loansModels
            .aggregate([
                {
                    $match: {
                        $and: [{ $or: statusMatchQuery }, matchQuery],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'borrower',
                    },
                },
                {
                    $lookup: {
                        from: 'fundings',
                        localField: '_id',
                        foreignField: 'loanId',
                        pipeline: [{ $project: { amount: 1 } }],
                        as: 'funding',
                    },
                },
                {
                    // check if available loan amount to fund is greater than amount to lend
                    $match: {
                        $expr: {
                            $let: {
                                vars: {
                                    availableToFund: {
                                        // $sum: '$funding.amount',
                                        $subtract: [
                                            {
                                                $toInt: '$amount',
                                            },
                                            {
                                                $toInt: {
                                                    $sum: '$funding.amount',
                                                },
                                            },
                                        ],
                                    },
                                },
                                in: {
                                    $gte: [
                                        '$$availableToFund',
                                        parseInt(amountToLend),
                                    ],
                                },
                            },
                        },
                    },
                },

                {
                    // remove array from result only return object
                    $unwind: '$borrower',
                },
                {
                    $addFields: {
                        totalFunds: {
                            $sum: '$funding.amount',
                        },
                    },
                },
                {
                    $project: {
                        modifyDate: 0,
                        borrowerId: 0,
                        __v: 0,
                        'borrower._id': 0,
                        'borrower.password': 0,
                        'borrower.salt': 0,
                        'borrower.idCardNumber': 0,
                        'borrower.birthDate': 0,
                        'borrower.idCardImage': 0,
                        'borrower.createdDate': 0,
                        'borrower.modifyDate': 0,
                        'borrower.__v': 0,
                    },
                },
            ])
            .exec();

        const autoLend = await autoLendModels.create({
            userId,
            tenorLength,
            borrowingCategory,
            yieldRange,
            amountToLend,
            // formatToJakartaTime(cancelTime),
        });
        if (loans.length === 0) {
            // if auto lend not match with any loans then save to auto_lend table
            autoLend.status = 'waiting';
            await autoLend.save();
            // console.log('autoLend', autoLend);
            return autoLend;
        }

        // if auto lend match with loans then fund the loans
        const yieldReturn =
            loans[0].yieldReturn * (parseInt(amountToLend) / loans[0].amount);

        const lender = await lenderModel.findOne({ userId });

        await fundingModels.create({
            userId,
            lenderId: lender._id,
            loanId: loans[0]._id,
            amount: amountToLend,
            yield: yieldReturn,
        });
        autoLend.status = 'matched';

        // await autoLend.save();

        let currentTotalFunds = !loans[0]?.totalFunds
            ? 0
            : loans[0]?.totalFunds;
        currentTotalFunds = currentTotalFunds + parseInt(amountToLend);

        // JIka loan sudah terpenuhi maka ubah status loan menjadi in borrowing
        const loan = await loansModels.findById(loans[0]._id);
        if (currentTotalFunds === loan.amount) {
            loan.status = 'in borrowing';
            const paymentSchedule = [];
            const paymentDate = new Date(getCurrentJakartaTime());
            if (loan.paymentSchema === 'Pelunasan Cicilan') {
                let paymentDateIncrement = 0;
                const totalBill =
                    loan.amount +
                    loan.yieldReturn +
                    parseInt(config.TAX_AMOUNT_APP);
                const monthlyPayment = Math.floor(totalBill / loan.tenor); // Calculate the integer part of the monthly payment
                const lastMonthPayment =
                    totalBill - monthlyPayment * (loan.tenor - 1); // Calculate the payment for the last month
                for (let i = 0; i < loan.tenor - 1; i++) {
                    paymentDateIncrement += 30;
                    // const loanAmount =
                    //     (loan.amount + loan.yieldReturn) / loan.tenor;
                    paymentSchedule.push({
                        amount: monthlyPayment,
                        date: paymentDate.setDate(paymentDate.getDate() + 30),
                    });
                }
                paymentSchedule.push({
                    amount: lastMonthPayment,
                    date: paymentDate.setDate(
                        paymentDate.getMonth() + loan.tenor * 30,
                    ),
                });
                // await this.paymentModel.create({
                //     loanId: loan._id,
                //     paymentSchedule,
                // });
            } else {
                paymentSchedule.push({
                    amount: totalBill,
                    date: paymentDate.setMonth(
                        paymentDate.getMonth() + loan.tenor,
                    ),
                });
            }

            await paymentModels.create({
                loanId: loan._id,
                paymentSchedule,
                status: 'in borrowing',
            });
            autoLend.status = 'in borrowing';

            // GENERATE CONTRACT FOR BORROWER
            const signatureKey = generateSignature({
                loanId: loan._id.toString(),
                borrowerId: loan.borrowerId.toString(),
            });

            const qrData =
                'https://www.google.com/search?q=ini+isi+halaman+validasi+contract.&oq=ini+isi+halaman+validasi+contract.&aqs=edge..69i57.30981j0j1&sourceid=chrome&ie=UTF-8';

            const [qrImage, borrowerUser] = await Promise.allSettled([
                generateQrImage(qrData),
                usersModel.findOne(
                    { _id: loan.userId },
                    { name: 1, email: 1, _id: 0 },
                ),
            ]);

            const pdfLink = await generateContractPDF({
                userId,
                loanId: loan._id.toString(),
                borrowerName: borrowerUser.value.name,
                // borrowerAddress: borrower.address,
                borrowerEmail: borrowerUser.value.email,
                borrowerPhone: borrowerUser.value.phoneNumber,
                loanYield: loan.yieldReturn,
                loanAmount: loan.amount,
                loanTenor: loan.tenor,
                paymentSchema: loan.paymentSchema,
                qrImage: qrImage.value,
            });

            // await loan.updateOne({ contractLink: pdfLink }).exec();
            // loan.save();
            const borrowerContract = await borrowerContractModels.create({
                borrowerId: loan.borrowerId,
                loanId: loan._id,
                signatureKey,
                contractLink: pdfLink,
            });

            const dashboardLink = 'https://amanahsyariah.vercel.app/lender';
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
                borrowerContract,
            );
        } else {
            loan.status = 'on process';
        }

        // await Promise.allSettled([autoLend.save(), loan.save()]);

        // Update balance for lender and borrower
        const [unused1, unused2, contractLink, unused3, unused4] =
            await Promise.allSettled([
                balanceModel.findOneAndUpdate(
                    {
                        userId,
                    },
                    {
                        $inc: {
                            amount: -parseInt(amountToLend),
                        },
                    },
                ),
                balanceModel.findOneAndUpdate(
                    {
                        userId: loan.userId,
                    },
                    {
                        $inc: {
                            amount: parseInt(amountToLend),
                        },
                    },
                ),
                lenderSignature({
                    loanId: loan._id.toString(),
                    userId,
                    lenderId: lender._id.toString(),
                    borrowerId: loan.borrowerId,
                }),
                autoLend.save(),
                loan.save(),
            ]);

        // *TODO: sent email to lender (Auto Lend Matched)
        // contractLink.value

        // console.log('loans', JSON.stringify(loans, null, 2));
        return true;
    } catch (error) {
        throw error;
    }
};
