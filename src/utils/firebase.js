import bucket from '../config/firebase.js';

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
