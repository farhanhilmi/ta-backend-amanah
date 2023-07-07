import balanceModel from '../../database/models/balance.model.js';
import loansModels from '../../database/models/loan/loans.models.js';
import paymentModels from '../../database/models/loan/payment.models.js';
import transactionModels from '../../database/models/transaction.models.js';
import { getCurrentJakartaTime } from '../../utils/index.js';

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
                const parsedData = JSON.parse(
                    keyValuePairs[0].split('data=')[1],
                );
                console.log('TransactionOut', parsedData);

                const transactionId = parsedData.idempotency_key;
                const userId = parsedData.idempotency_key.split('-')[0];
                const amount = parsedData.amount;
                const transactionTime = parsedData.time_served;

                if (parsedData.remark === 'Disbursement') {
                    await loansModels.findOneAndUpdate(
                        {
                            userId,
                        },
                        {
                            status: 'disbursement',
                        },
                    );

                    const paymentDate = new Date(getCurrentJakartaTime());

                    let paymentDateIncrement = 0;
                    const payment = await paymentModels.findOne({
                        loanId: loan._id,
                    });

                    const newPaymentDate = payment.paymentSchedule.forEach(
                        (item) => {
                            paymentDateIncrement += 30;
                            item.date = paymentDate.setDate(
                                paymentDate.getDate() + paymentDateIncrement,
                            );
                        },
                    );

                    payment.status = 'disbursement';
                    payment.paymentSchedule = newPaymentDate;
                    payment.save();
                }

                await Promise.allSettled([
                    transactionModels.findOneAndUpdate(
                        {
                            transactionId,
                        },
                        {
                            status: 'done',
                            transactionTime,
                        },
                    ),
                    balanceModel.findOneAndUpdate(
                        {
                            userId,
                        },
                        {
                            $inc: {
                                amount: -amount,
                            },
                        },
                    ),
                ]);

                // const token = data.token;

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
