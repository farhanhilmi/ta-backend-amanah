import balanceModel from '../../database/models/balance.model.js';
import transactionModels from '../../database/models/transaction.models.js';

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
                            await balanceModel.findOneAndUpdate(
                                { userId: user.userId },
                                { $inc: { amount: -amount } },
                            );
                            user.status = 'done';
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
