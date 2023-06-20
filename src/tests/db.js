import mongoose, { set } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

mongoose.promise = global.Promise;

let mongoServer;

const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// get db
const getDB = async () => {
    if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
    }
    const client = await MongoClient.connect(mongoServer.getUri(), opts);
    const db = client.db(mongoServer.instanceInfo.dbName);
    return db;
};

const connect = async () => {
    try {
        set('strictQuery', false);
        await mongoose.disconnect();

        mongoServer = await MongoMemoryServer.create();
        // const client = await MongoClient.connect(mongoServer.getUri(), opts);
        // const db = client.db(mongoServer.instanceInfo.dbName);

        const mongoUri = await mongoServer.getUri();
        await mongoose.connect(mongoUri, opts);
    } catch (error) {
        console.log('ERORR', error);
    }
};

const close = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
};

const clear = async () => {
    const { collections } = mongoose.connection;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};

export default {
    connect,
    close,
    clear,
    getDB,
};
