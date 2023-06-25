import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Routes from './routes/index.js';
import busboy from 'busboy';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { notificationListener } from './utils/midtrans.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async () => {
    try {
        const app = express();
        app.use(cors({ origin: '*' }));
        app.use(express.json());
        // app.use(cors({ origin: ['http://localhost:8000'] }));

        // Specify the storage configuration
        // const multerStorage = multer.memoryStorage();
        // const upload = multer({ storage: multerStorage }).array('files', 5);

        app.use((req, res, next) => {
            if (req.is('multipart/form-data')) {
                const bb = busboy({ headers: req.headers });
                req.pipe(bb);
                req.body = {};
                req.files = [];

                bb.on('field', (fieldname, val) => {
                    req.body[fieldname] = val;
                });

                bb.on(
                    'file',
                    (fieldname, file, filename, encoding, mimetype) => {
                        // Handle the file here, e.g., save it to disk or process it
                        // This example simply assigns the file details to req.file

                        // req.files.push({
                        //     fieldname,
                        //     filename,
                        //     buffer: fileBuffer,
                        //     mimetype: filename.mimeType,
                        // });

                        const chunks = [];

                        file.on('data', (chunk) => {
                            chunks.push(chunk);
                        });

                        file.on('end', () => {
                            const fileBuffer = Buffer.concat(chunks);

                            req.files.push({
                                fieldname,
                                filename,
                                buffer: fileBuffer,
                                mimetype: filename.mimeType,
                            });
                            // Process the file data (e.g., upload to Firebase)
                            // Your custom logic goes here
                        });

                        // Consume the file stream to avoid leaving it open
                        file.resume();
                    },
                );

                bb.on('finish', () => {
                    next();
                });
            } else {
                next();
            }
        });

        app.use(
            morgan(
                ':method :url :status :res[content-length] - :response-time ms',
            ),
        );
        morgan.token('param', function (req, res, param) {
            return req.params[param];
        });

        // app.get('/', (req, res, next) => {
        //     res.status(200).json({
        //         status: 'success',
        //         environment: process.env.NODE_ENV,
        //         message: `Welcome to the API. Please use the correct endpoint.`,
        //     });
        //     res.end();
        // });
        app.get('/', function (req, res) {
            res.sendFile(path.join(__dirname, './views/template.html'));
        });

        // Load API Routes
        Routes(app);

        // app.post('/payment/notification', notificationListener);

        // API ENDPOINT NOT FOUND
        app.use((req, res, next) => {
            const error = new Error("API endpoint doesn't exist!");
            error.statusCode = 404;
            error.status = 'Not Found';
            next(error);
        });

        // error handler middleware
        app.use((error, req, res, _) => {
            console.log('error', error);
            const message = !error.statusCode
                ? 'Internal Server Error'
                : error.message;
            res.status(error.statusCode || 500).json({
                // status: !error.statusCode
                //     ? 'Internal Server Error'
                //     : error.status,
                success: false,
                data: [],
                message,
            });
        });

        return app;
    } catch (error) {
        throw error;
    }
};
