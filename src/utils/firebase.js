import axios from 'axios';
import bucket from '../config/firebase.js';
import config from '../config/index.js';

export const uploadFileToFirebase = async (file, filename) => {
    // Generate a unique filename for the uploaded file
    // const newFilename = `${Date.now()}_${file?.filename?.filename}`;

    // Create a reference to the Firebase Storage bucket

    // Upload the file to Firebase Storage
    const fileOptions = {
        metadata: {
            contentType: file.mimetype,
        },
    };
    await bucket.file(filename).save(file.buffer, fileOptions);

    // Make the uploaded file public
    await bucket.file(filename).makePublic();

    // Get the public URL of the uploaded file
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return fileUrl;
};

// export const generateDynamicLink = async (token, userId) => {
//     const { data } = await axios.post(config.FIREBASE_DEEP_LINK_URL, {
//         dynamicLinkInfo: {
//             domainUriPrefix: config.FIREBASE_DEEP_LINK_DOMAIN_URI_PREFIX,
//             link: `${
//                 config.DEEP_LINK_URL
//             }?token=${token}&uid=${userId.toString()}`,
//             androidInfo: {
//                 androidPackageName: config.ANDROID_PACKAGE_NAME,
//             },
//         },
//     });
//     return data;
// };

export const generateDynamicLink = async (token, userId, email) => {
    try {
        const { data } = await axios.post(config.FIREBASE_DEEP_LINK_URL, {
            dynamicLinkInfo: {
                domainUriPrefix: config.FIREBASE_DEEP_LINK_DOMAIN_URI_PREFIX,
                link: `${
                    config.DEEP_LINK_URL
                }?token=${token}&uid=${userId.toString()}&email=${email}&type=forgetpassword`,
                androidInfo: {
                    androidPackageName: config.ANDROID_PACKAGE_NAME,
                },
            },
        });
        return data;
    } catch (error) {
        console.log('ERROR GENERATE DYNAMIC LINK', error);
    }
};
