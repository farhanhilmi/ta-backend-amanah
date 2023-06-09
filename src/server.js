import dbConnection from './database/connection.js';
import config from './config/index.js';
import expressApp from './app.js';
// import { CreateChannel } from './utils/messageBroker.js';
// import errorHandler from './utils/error/index.js';

const startServer = async () => {
    try {
        const app = await expressApp();

        app.listen(config.app.port, () => {
            console.log(
                `[${config.app.name}] listening to port ${config.app.port}`,
            );
            // console.log('process.env', process.env);
        }).on('error', (err) => {
            console.log(err);
            // process.exit();
        });
        // .on('close', () => {
        //     channel.close();
        // });
    } catch (error) {
        console.log('ERROR', error);
    }
};

startServer();
