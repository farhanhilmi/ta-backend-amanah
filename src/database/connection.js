import mongoose from 'mongoose';
import { set } from 'mongoose';
import config from '../config/index.js';

const isTest = false;
// console.log(isTest);

set('strictQuery', false);

let mongoServer;

let connectionPromise;

if (isTest) {
    // connectionPromise = new Promise(async (resolve, reject) => {
    //     mongoServer = await MongoMemoryServer.create();
    //     const mongoUri = await mongoServer.getUri();
    //     const opts = {
    //         useNewUrlParser: true,
    //         useUnifiedTopology: true,
    //     };
    //     await mongoose.connect(mongoUri, opts);
    //     const conn = mongoose.connection;
    //     // console.log('conn', conn);
    //     conn.on('error', (error) => {
    //         console.error('Database connection error:', error);
    //         reject(error);
    //     });
    //     conn.once('open', () => {
    //         console.info('Connection to database is successful');
    //         resolve(conn);
    //     });
    // });
} else {
    connectionPromise = new Promise((resolve, reject) => {
        mongoose.connect(config.db.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: false,
        });

        const conn = mongoose.connection;
        conn.on('error', (error) => {
            console.error('Database connection error:', error);
            reject(error);
        });
        conn.once('open', () => {
            console.info('Connection to database is successful');
            resolve(conn);
        });
    });
}

export const close = async () => {
    await mongoose.disconnect();
    // await mongoServer.stop();
};

export const clear = async () => {
    // delete databasde

    const { collections } = mongoose.connection;
    // console.log('collections', collections);
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
    // Delete the database
    mongoose.connection
        .dropDatabase()
        .then(() => {
            // console.log('Database deleted successfully.');
            // Close the MongoDB connection
            mongoose.connection.close();
        })
        .catch((error) => {
            console.error('Error deleting database:', error);
            // Close the MongoDB connection
            mongoose.connection.close();
        });
};

export default connectionPromise;
export const session = (async () => {
    await mongoose.startSession();
})();
