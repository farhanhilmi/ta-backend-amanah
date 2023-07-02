import config from '../../config/index.js';
import lenderModel from '../../database/models/lender/lender.model.js';
import autoLendModels from '../../database/models/loan/autoLend.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import { getCurrentJakartaTime, toTitleCase } from '../../utils/index.js';

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

        // if auto lend not match with any loans then save to auto_lend table
        const autoLend = await autoLendModels.create({
            userId,
            tenorLength,
            borrowingCategory,
            yieldRange,
            amountToLend,
            // formatToJakartaTime(cancelTime),
        });
        if (loans.length === 0) {
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
                        date: paymentDate.setDate(
                            paymentDate.getDate() + paymentDateIncrement,
                        ),
                    });
                }
                paymentSchedule.push({
                    amount: lastMonthPayment,
                    date: paymentDate.setDate(
                        paymentDate.getDate() + paymentDateIncrement + 30,
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
                paymentSchedule,
            });
            autoLend.status = 'in borrowing';
        } else {
            loan.status = 'on process';
        }

        await Promise.allSettled([autoLend.save(), loan.save()]);

        // console.log('loans', JSON.stringify(loans, null, 2));
    } catch (error) {
        throw error;
    }
};
