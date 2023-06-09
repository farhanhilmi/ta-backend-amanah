import mongoose, { set } from 'mongoose';
import config from '../config/index.js';

set('strictQuery', false);
mongoose.connect(config.db.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false,
});

const conn = mongoose.connection;
conn.on('error', () =>
    console.error.bind(console, 'database connection error'),
);
conn.once('open', () => console.info('Connection to Database is successful'));

export default conn;
