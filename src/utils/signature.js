import fs from 'fs';
import crypto from 'crypto';
import qr from 'qrcode';
import bucket from '../config/firebase.js';
import PDFDocument from 'pdfkit';

import {
    encryptCombinedValues,
    formatRupiah,
    getCurrentDateIndonesia,
} from './index.js';

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import config from '../config/index.js';
import numberToWord from './numberToWord.js';

const PUBLIC_KEY_PATH = './keys/public.pem';
const PRIVATE_KEY_PATH = './keys/private_decrypted.pem';

// Function to generate a digital signature
export const generateSignature = (data) => {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(JSON.stringify(data));
    const signature = sign.sign(privateKey, 'base64');
    return signature;
};

// Function to verify a digital signature
export const verifySignature = (data, signature) => {
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(JSON.stringify(data));
    const isValid = verify.verify(publicKey, signature, 'base64');
    console.log('Signature verification result:', isValid);
    return isValid;
};

export const generateQrImage = async (qrData) => await qr.toBuffer(qrData);

const basedir = path.resolve(process.cwd());

// Generate the PDF document
export const generateContractPDF = async ({
    borrowerName,
    // borrowerAddress,
    borrowerPhone,
    borrowerEmail,
    loanYield,
    loanAmount,
    loanTenor,
    qrImage,
    paymentSchema,
    userId,
    loanId,
}) => {
    return new Promise((resolve, reject) => {
        // Get the current module's file path
        // const __filename = fileURLToPath(import.meta.url);

        // Get the directory name from the file path
        // const __dirname = dirname(__filename);

        // const pdfPath = 'output-sign.pdf'; // Specify the path to save the PDF
        let pdfPath = '';
        // if nodeport is production, set pdfpath to /tmp/output-sign.pdf
        if (config.NODE_ENV === 'production') {
            pdfPath = '/tmp/output-sign.pdf';
        } else {
            pdfPath = 'temp.pdf';
        }

        const doc = new PDFDocument({
            margins: {
                top: 72,
                bottom: 50,
                left: 72,
                right: 72,
            },
        });
        const writeStream = fs.createWriteStream(pdfPath);

        doc.pipe(writeStream);

        // doc.addPage();
        // Add content to the PDF
        doc.fontSize(12);
        doc.font('Helvetica-Bold').text('Pihak Peminjam');
        doc.font('Helvetica').text(
            `${borrowerName}
${borrowerPhone}
${borrowerEmail}
    `,
            { align: 'left' },
        );
        // doc.moveDown();
        //     doc.text(
        //         `[Nama Pemberi Pinjaman]
        // [Alamat Pemberi Pinjaman]
        // [Nomor Telepon Pemberi Pinjaman]
        // [Email Pemberi Pinjaman]

        // 20 Maret 2020
        //     `,
        //         { align: 'left' },
        //     );
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.font('Helvetica-Bold').text(
            `Perjanjian Pinjaman Amanah Peer-to-Peer Lending Syariah
    `,
            { align: 'center' },
        );
        doc.moveDown();
        doc.font('Helvetica');
        doc.text(
            `Pihak Peminjam dan Pihak Pemberi Pinjaman, yang selanjutnya disebut sebagai "Pihak-pihak" dengan ini sepakat untuk mengatur perjanjian pinjaman peer-to-peer (P2P) lending syariah berikut ini:
    `,
            { align: 'justify' },
        );
        doc.moveDown();
        // doc.list(['Pendahuluan', 'Jumlah Pinjaman'], { listType: 'numbered' });
        doc.fontSize(14).text('A. Pendahuluan', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.list(
            [
                'Pihak Pemberi Pinjaman adalah individu entitas yang menyediakan layanan pinjaman kepada individu atau entitas lain yang membutuhkan pembiayaan',
                'Pihak Peminjam adalah individu atau entitas yang ingin meminjam dana melalui platform P2P lending syariah yang disediakan oleh Pihak Pemberi Pinjaman.',
                'Pihak-pihak sepakat untuk menjalankan perjanjian pinjaman ini sesuai dengan prinsip-prinsip syariah.',
            ],
            { listType: 'numbered', align: 'justify' },
        );
        doc.moveDown();
        doc.moveDown();
        doc.fontSize(14).text('B. Jumlah Pinjaman', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.list(
            [
                // `Pihak Pemberi Pinjaman setuju untuk memberikan jumlah pinjaman sebesar Rp. ${loanAmount} [dan kata-kata] (IDR) kepada Pihak Peminjam.`,
                'Pihak Peminjam setuju untuk menerima jumlah pinjaman tersebut dan bertanggung jawab untuk mengembalikan jumlah tersebut beserta dengan imbal hasil yang telah disepakati atau ditentukan oleh peminjam.',
                `Total jumlah pinjaman yang akan diterima oleh Pihak Peminjam adalah sebesar ${formatRupiah(
                    loanAmount,
                    'Rp. ',
                )} [${numberToWord(parseInt(loanAmount))} rupiah] (IDR).`,
                // `Pinjaman ini memiliki jangka waktu ${loanTenor} dimulai dari tanggal terpenuhinya total jumlah pinjaman.`,
            ],
            { listType: 'numbered', align: 'justify' },
        );
        // doc.moveDown();
        // doc.moveDown();
        doc.addPage();
        doc.fontSize(14).text('C. Jangka Waktu Pinjaman', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.list(
            [
                `Pinjaman ini memiliki jangka waktu ${loanTenor} bulan dimulai dari tanggal terpenuhinya jumlah pinjaman.`,
                'Pihak Peminjam harus mengembalikan seluruh jumlah pinjaman beserta imbal hasil yang telah disepakati pada tanggal jatuh tempo yang telah ditentukan.',
            ],
            { listType: 'numbered', align: 'justify' },
        );
        doc.moveDown();
        doc.moveDown();
        doc.fontSize(14).text('D. Imbal Hasil', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.list(
            [
                'Total imbal hasil merupakan angka yang telah disepakati atau ditentukan sendiri oleh Pihak Peminjam pada saat pengajuan pinjaman.',
                `Total imbal hasil yang akan diterima oleh Pihak Pemberi Pinjaman adalah sebesar ${formatRupiah(
                    loanYield,
                    'Rp. ',
                )} [${numberToWord(parseInt(loanYield))} rupiah] (IDR).`,
            ],
            { listType: 'numbered', align: 'justify' },
        );
        doc.moveDown();
        doc.moveDown();
        doc.fontSize(14).text('E. Pembayaran', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.list(
            [
                `Pihak Peminjam setuju untuk melakukan pembayaran ${paymentSchema} pinjaman beserta imbal hasil pada tanggal jatuh tempo yang telah ditentukan.`,
                `Pembayaran harus dilakukan dalam mata uang Indonesia (IDR) ke Virtual Account yang telah ditentukan.`,
                'Pihak Peminjam bertanggung jawab atas semua biaya transfer atau potongan bank yang terkait dengan pembayaran pinjaman ini.',
            ],
            { listType: 'numbered', align: 'justify' },
        );
        doc.moveDown();
        doc.moveDown();
        doc.fontSize(14).text('F. Keabsahan dan Kepastian Hukum', {
            align: 'center',
        });
        doc.moveDown();
        doc.fontSize(12);
        doc.list(
            [
                'Perjanjian ini merupakan kesepakatan yang sah antara Pihak Peminjam dan Pihak Pemberi Pinjaman dan tunduk pada hukum yang berlaku di Republik Indonesia.',
                'Jika ada perselisihan antara Pihak-pihak terkait perjanjian ini, perselisihan tersebut akan diselesaikan melalui negosiasi yang baik antara Pihak-pihak terlebih dahulu.',
            ],
            { listType: 'numbered', align: 'justify' },
        );
        doc.moveDown();
        doc.text(
            'Dengan menandatangani perjanjian ini, Pihak Peminjam menyatakan bahwa mereka telah membaca, memahami, dan setuju untuk mematuhi semua ketentuan dan kondisi yang ditetapkan dalam perjanjian ini.',
            { align: 'justify' },
        );
        // doc.moveDown();
        // doc.moveDown();

        // doc.text('User Full Name:', { continued: true });
        // doc.text(borrowerName);
        // doc.moveDown();
        // doc.text('User ID:', { continued: true });
        // doc.text(userId);
        // doc.moveDown();
        // doc.text('Contract Details:', { continued: true });
        // doc.text(contractDetails);
        // doc.moveDown();
        // doc.moveDown();

        doc.moveDown();
        const qrImageEmbed = doc.openImage(qrImage);
        const qrImageWidth = 100;
        const qrImageHeight = 100;

        const qrImageX = qrImageWidth - 33; // Adjust the position as needed
        const qrImageY = doc.page.height - qrImageHeight - 75; // Adjust the position as needed

        doc.text(
            `Pihak Peminjam:
${borrowerName}
    `,
            doc.page.width - 420,
            doc.page.height - 155,
            { width: 160 },
            // { align: 'right' },
        );
        const { time, date } = getCurrentDateIndonesia();
        doc.fontSize(12).text(
            `${time} WIB 
${date}`,
            doc.page.width - 420,
            doc.page.height - 110,
            // { align: 'right' },
        );
        // QR
        doc.image(qrImageEmbed, qrImageX, qrImageY, {
            width: qrImageWidth,
            height: qrImageHeight,
        });
        // LINK
        doc.fontSize(9).text(
            'Scan QR code to validate contract.',
            qrImageX + 5,
            doc.page.height - 65,
        );

        doc.fontSize(8)
            .fillColor('gray')
            .text(
                `* Penandatanganan perjanjian ini menggunakkan waktu GMT+7 (Waktu Indonesia Barat).`,
                doc.page.width - 420,
                doc.page.height - 81,
                // {  },
                // { align: 'right' },
            );

        // doc.text('Scan QR code to validate contract.', { align: 'right' });

        // doc.text('Signature:', { continued: true });
        // doc.text(signature);

        doc.end();

        let pdfLink = '';

        writeStream.on('finish', async () => {
            try {
                // Upload the PDF file to Firebase Storage
                const CONTRACT_ENCRYPTION_KEY =
                    config.CONTRACT_ENCRYPTION_KEY ||
                    'c3a72c3f6d1e88c82a5b74fb5241a8f195b7e5e4e4c51f0a1d3b0d234950e203';

                const combinedValues = `${userId}-${loanId}`;

                const { encryptedValues } = encryptCombinedValues(
                    combinedValues,
                    CONTRACT_ENCRYPTION_KEY,
                );

                const storageDir = `contracts/lender/loan`;
                const [file] = await bucket.upload(pdfPath, {
                    destination: `${storageDir}/${encryptedValues}.pdf`,
                    public: true,
                });
                // Get the public URL of the uploaded file
                // const [publicUrl] = await file.getSignedUrl({
                //     action: 'read',
                //     expires: '03-01-2500', // Set an appropriate expiration date
                // });

                fs.unlinkSync(pdfPath);
                // if (process.env.NODE_ENV === 'production') {
                // } else {
                //     fs.unlinkSync('/tmp/output-sign.pdf');

                // }

                // console.log('File uploaded successfully: ');
                resolve(
                    `https://storage.googleapis.com/${bucket.name}/${storageDir}/${encryptedValues}.pdf`,
                );
            } catch (error) {
                reject(error);
                console.error('Error uploading PDF:', error);
            }
            // finally {
            //     // Delete the temporary PDF file
            //     fs.unlinkSync(
            //         process.env.NODE_ENV === 'production' ? pdfPath : pdfPath,
            //     );
            // }
        });

        writeStream.on('error', (error) => {
            console.error('Error generating PDF:', error);
            reject(error);
        });
    });
};
