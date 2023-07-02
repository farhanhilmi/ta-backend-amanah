import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import bucket from '../config/firebase.js';
import crypto from 'crypto';

import axios from 'axios';
import fs from 'fs';
import {
    encryptCombinedValues,
    formatRupiah,
    getCurrentDateIndonesia,
} from './index.js';

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import config from '../config/index.js';
import usersModel from '../database/models/users.model.js';
import borrowerContractModels from '../database/models/loan/borrowerContract.models.js';
import lenderContractModels from '../database/models/loan/lenderContract.models.js';
const basedir = path.resolve(process.cwd());

export default async ({ userId, borrowerId, lenderId, loanId }) => {
    try {
        // Get the current module's file path
        // const __filename = fileURLToPath(import.meta.url);

        // // Get the directory name from the file path
        // const __dirname = dirname(__filename);

        const [user, borrowerContract] = await Promise.allSettled([
            await usersModel.findOne({ _id: userId }),
            await borrowerContractModels.findOne({ borrowerId }),
        ]);
        const response = await axios.get(borrowerContract.value.contractLink, {
            responseType: 'arraybuffer',
        });
        const signDate = '20-20-2020';

        // const response = await axios.get(contractLink, {
        //     responseType: 'arraybuffer',
        // });
        const existingPdfBytes = response.data;

        // Create a new PDF document
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        let pdfResult = '';
        // if nodeport is production, set pdfResult to /tmp/output-sign.pdf
        if (config.NODE_ENV === 'production') {
            pdfResult = '/tmp/output-sign.pdf';
        } else {
            pdfResult = 'temp.pdf';
        }

        // Get the last page of the PDF
        const lastPage = pdfDoc.getPages().pop();
        // Get the first page
        const firstPage = pdfDoc.getPages()[0];

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        // Set the font color to black
        const fontColor = rgb(0, 0, 0); // Black color

        firstPage.setFont(fontBold);
        firstPage.setFontSize(12);

        // firstPage.moveDown(2);
        firstPage.setFontColor(fontColor);
        // top right
        firstPage.drawText('Pihak Pendana', {
            x: 365,
            y: 710,
            maxWidth: 180,
            lineHeight: 14,
        });
        firstPage.setFont(font);
        firstPage.setFontSize(12);
        firstPage.drawText(
            `${user.value.name}
${user.value.phoneNumber}
${user.value.email}
        `,
            {
                x: 365,
                y: 696,
                maxWidth: 180,
                lineHeight: 14,
            },
        );

        lastPage.setFont(font);
        lastPage.setFontSize(12);

        lastPage.drawText(
            `Pihak Pendana:
${user.value.name}
        `,
            {
                x: 360,
                y: 145,
                maxWidth: 180,
                lineHeight: 14,
            },
        );
        // lastPage.moveDown();
        const { time, date } = getCurrentDateIndonesia();
        lastPage.drawText(
            `
${time} WIB
${date}`,
            {
                x: 360,
                y: 101,
                maxWidth: 200,
                lineHeight: 14,
            },
        );

        // Save the modified PDF to a new buffer
        const modifiedPdfBytes = await pdfDoc.save();

        // Save the modified PDF to a file
        fs.writeFileSync(pdfResult, modifiedPdfBytes);

        const CONTRACT_ENCRYPTION_KEY =
            config.CONTRACT_ENCRYPTION_KEY ||
            'c3a72c3f6d1e88c82a5b74fb5241a8f195b7e5e4e4c51f0a1d3b0d234950e203';
        const combinedValues = `${userId}-${loanId}-${borrowerContract.value.borrowerId}`;

        const { encryptedValues } = encryptCombinedValues(
            combinedValues,
            CONTRACT_ENCRYPTION_KEY,
        );

        const storageDir = `contracts/lender/loan`;
        // const encryptedKey = borrowerContract.value.contractLink
        //     .split('loan/')[1]
        //     .split('.')[0];
        // console.log('encryptedKey', encryptedKey);
        const [file] = await bucket.upload(pdfResult, {
            destination: `${storageDir}/${encryptedValues}.pdf`,
            public: true,
        });
        fs.unlinkSync(pdfResult);

        const contractLink = `https://storage.googleapis.com/${bucket.name}/${storageDir}/${encryptedValues}.pdf`;

        await lenderContractModels.create({
            lenderId,
            contractLink,
            signatureKey: borrowerContract.value.signatureKey,
            loanId,
        });
        // console.log(
        //     `https://storage.googleapis.com/${bucket.name}/${storageDir}/${encryptedKey}.pdf`,
        // );
        console.log('contractLink', contractLink);

        console.log('PDF modified successfully!');
        return contractLink;
    } catch (error) {
        console.error('Error modifying PDF:', error);
        throw error;
    }
};
