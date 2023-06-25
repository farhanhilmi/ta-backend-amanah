export default async (req, res, next) => {
    try {
        const payload = req.body;
        let body = '';
        console.log('inquiryBankAccount MASUK');
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
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

                // Use the parsedData object and token as needed
                // console.log(parsedData);
                // console.log(token);
                console.log('inquiryBankAccount', parsedData);

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
