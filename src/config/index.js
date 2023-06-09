import dotenv from 'dotenv';

import path, { join } from 'path';

const NODE_ENV = process.env.NODE_ENV;
const env = NODE_ENV == 'test' ? 'development.env' : `${NODE_ENV}.env`;

const basedir = path.resolve(process.cwd());
dotenv.config({
    path: join(basedir, env),
});
console.log('current env:', env);

const {
    APP_NAME,
    MONGODB_URI,
    PORT,
    REDIS_SERVER,
    PROJECT_URL,
    SALT_FORGET_PASSWORD_TOKEN,
    SALT_VERIFICATION_EMAIL_TOKEN,
    CLIENT_REACT_APP_HOST,
    ACCESS_TOKEN_PRIVATE_KEY,
    REFRESH_TOKEN_PRIVATE_KEY,
    FIREBASE_DEEP_LINK_URL,
    FIREBASE_DEEP_LINK_DOMAIN_URI_PREFIX,
    DEEP_LINK_URL,
    ANDROID_PACKAGE_NAME,
    REFRESH_TOKEN_EXPIRES_IN,
    ACCESS_TOKEN_EXPIRES_IN,
    EMAIL_PASS,
    EMAIL_USER,
    OAUTH_REFRESH_TOKEN,
    OAUTH_CLIENT_SECRET,
    OAUTH_CLIENTID,
    OTP_EXPIRED,
    TAX_AMOUNT_APP,
    CONTRACT_ENCRYPTION_KEY,
    MIDTRANST_MERCHANT_ID,
    MIDTRANST_CLIENT_KEY,
    MIDTRANST_SERVER_KEY,
    FLIP_SECRET_KEY,
    FLIP_BASIC_AUTH,
} = process.env;

const config = {
    app: {
        port: PORT,
        // host: HOST,
        name: APP_NAME,
    },
    db: {
        uri: MONGODB_URI,
    },
    tokenExpires: {
        refresh: REFRESH_TOKEN_EXPIRES_IN,
        access: ACCESS_TOKEN_EXPIRES_IN,
    },
    mail: {
        user: EMAIL_USER,
        password: EMAIL_PASS,
        OAUTH_CLIENTID: OAUTH_CLIENTID,
        OAUTH_CLIENT_SECRET: OAUTH_CLIENT_SECRET,
        OAUTH_REFRESH_TOKEN: OAUTH_REFRESH_TOKEN,
    },
    OTP_EXPIRED,
    REDIS_SERVER,
    SALT_FORGET_PASSWORD_TOKEN,
    SALT_VERIFICATION_EMAIL_TOKEN,
    CLIENT_REACT_APP_HOST,
    PROJECT_URL,
    ACCESS_TOKEN_PRIVATE_KEY,
    REFRESH_TOKEN_PRIVATE_KEY,
    FIREBASE_DEEP_LINK_URL,
    FIREBASE_DEEP_LINK_DOMAIN_URI_PREFIX,
    DEEP_LINK_URL,
    ANDROID_PACKAGE_NAME,
    NODE_ENV,
    TAX_AMOUNT_APP,
    CONTRACT_ENCRYPTION_KEY,
    MIDTRANST_MERCHANT_ID,
    MIDTRANST_CLIENT_KEY,
    MIDTRANST_SERVER_KEY,
    FLIP_SECRET_KEY,
    FLIP_BASIC_AUTH,
};

export default config;
