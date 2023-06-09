// Initialize Firebase Admin SDK
import serviceAccountKey from '../../serviceAccountKey.js';
import admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    storageBucket: 'amanah-p2p-lending-syariah.appspot.com',
});

const bucket = admin.storage().bucket();

export default bucket;
