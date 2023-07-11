import balanceModel from '../../database/models/balance.model.js';
import borrowerModels from '../../database/models/borrower/borrower.models.js';
import fundingModels from '../../database/models/loan/funding.models.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import transactionModels from '../../database/models/transaction.models.js';
import { toObjectId } from '../../utils/index.js';
import { updateBorrowerPerformance } from '../users/transactions.js';

export default async (req, res, next) => {
    try {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
            // Split the body by the '&' character to separate key-value pairs
            const keyValuePairs = body.split('&');

            // Create an empty object to store the extracted data
            const data = {};

            keyValuePairs.forEach((pair) => {
                const [key, value] = pair.split('=');
                data[key] = decodeURIComponent(value);
            });

            try {
                const parsedData = JSON.parse(data.data);
                const token = data.token;
                console.log('TransactionIN', parsedData);

                switch (parsedData.status) {
                    case 'SUCCESSFUL':
                        console.log('SUCCESSFUL');

                        const title = parsedData.bill_title.split(' #');
                        const transactionId = title[1];
                        const transactionType = title[0];
                        const amount = parsedData.amount;
                        const transactionTime = parsedData.created_at;
                        console.log('transactionId', transactionId);

                        const user = await transactionModels.findOne({
                            transactionId,
                        });

                        if (transactionType === 'Deposit') {
                            console.log('deposit');
                            console.log('amount', amount);
                            await balanceModel.findOneAndUpdate(
                                { userId: user.userId },
                                { $inc: { amount: amount }, transactionTime },
                            );
                            user.status = 'done';
                            await user.save();

                            break;
                        }

                        if (transactionType === 'Repayment') {
                            console.log('Repayment');
                            const loanId = user.repaymentId.split('-')[0];
                            const repaymentId = user.repaymentId.split('-')[1];
                            const payment = await paymentModels
                                .findOne(
                                    { loanId },
                                    { paymentSchedule: 1, _id: 0 },
                                )
                                .sort({ 'paymentSchedule.date': 1 });

                            console.log('payment', payment);
                            let repaymentStatus = 'disbursement';
                            let paidStatus = '';
                            // let newLoanLimit = 0;
                            const borrower = await borrowerModels.findOne({
                                userId: user.userId,
                            });
                            const loanObject = await loansModels.findOne({
                                _id: loanId,
                            });

                            let paymentLate = false;

                            const paymentSchedule =
                                payment.paymentSchedule.filter(
                                    (item, index) => {
                                        // console.log('index', index);
                                        // console.log('item', item);

                                        if (item.status == 'late paid') {
                                            paymentLate = true;
                                        }
                                        // if (
                                        //     index ===
                                        //     payment.paymentSchedule.length - 1
                                        // ) {
                                        //     // This is the last index
                                        //     // repaymentStatus = 'repayment';
                                        //     updateBorrowerPerformance(
                                        //         user.userId,
                                        //         loanObject.amount,
                                        //         item.date,
                                        //         paymentLate,
                                        //     );
                                        // }
                                        // console.log(
                                        //     repaymentId === item._id.toString(),
                                        // );
                                        // if (
                                        //     item._id.toString() === repaymentId
                                        // ) {
                                        //     console.log('MASYKKK');
                                        //     return item;
                                        // }

                                        return (
                                            item._id.toString() === repaymentId
                                        );
                                    },
                                );

                            if (paymentSchedule.length === 0) {
                                console.log(
                                    'paymentSchedule zero',
                                    paymentSchedule,
                                );
                                break;
                            }

                            payment.paymentSchedule.find((item, index) => {
                                if (
                                    index ===
                                    payment.paymentSchedule.length - 1
                                ) {
                                    // This is the last index
                                    repaymentStatus = 'repayment';

                                    updateBorrowerPerformance(
                                        user.userId,
                                        loanObject.amount,
                                        item.date,
                                        paymentLate,
                                    );
                                }

                                return item._id.toString() === repaymentId;
                            });

                            if (paymentSchedule[0].date < new Date()) {
                                // repaymentStatus = 'late repayment';
                                paidStatus = 'late paid';
                            } else {
                                // repaymentStatus = 'repayment';
                                paidStatus = 'paid';
                            }

                            // if (paymentSchedule[0].date < new Date()) {
                            //     // repaymentStatus = 'late repayment';
                            // } else {
                            //     // repaymentStatus = 'repayment';
                            // }
                            console.log('paidStatus', paidStatus);
                            console.log('repaymentStatus', repaymentStatus);

                            await Promise.allSettled([
                                loansModels.findOneAndUpdate(
                                    {
                                        _id: loanId,
                                    },
                                    {
                                        status: repaymentStatus,
                                    },
                                ),
                                paymentModels.findOneAndUpdate(
                                    {
                                        loanId,
                                        'paymentSchedule._id':
                                            toObjectId(repaymentId),
                                    },
                                    {
                                        $set: {
                                            'paymentSchedule.$.status':
                                                paidStatus,
                                            status: repaymentStatus,
                                        },
                                    },
                                ),
                            ]);

                            if (repaymentStatus == 'repayment') {
                                const fundings = await fundingModels.find({
                                    loanId,
                                });

                                fundings.forEach(async (funding) => {
                                    const totalReturn =
                                        funding.amount + funding.yield;
                                    await balanceModel.findOneAndUpdate(
                                        {
                                            userId: funding.userId,
                                        },
                                        {
                                            $inc: { amount: totalReturn },
                                        },
                                    );
                                });
                            }

                            user.status = 'done';
                            // borrower.loanLimit = newLoanLimit;
                            borrower.save();
                            await user.save();

                            break;
                        }

                        break;
                }

                // Use the parsedData object and token as needed
                // console.log(parsedData);
                // console.log(token);

                res.statusCode = 200;
                res.status(200).json({ message: 'success' });
            } catch (error) {
                console.log('error', error);
                res.status(400).json({ message: 'success' });
                // res.end('Invalid JSON format');
            } finally {
                res.end();
            }

            // body = Buffer.concat(body).toString();
        });
    } catch (error) {
        next(error);
    }
};
