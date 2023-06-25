import mongoose from 'mongoose';
import _ from 'underscore';
import lodash from 'lodash';
import crypto from 'crypto';
import moment from 'moment-timezone';
import { RequestError, ValidationError } from './errorHandler.js';
import { v4 as uuidV4 } from 'uuid';

export const generateUUID = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueID = `${timestamp}${randomString}`;

    return uniqueID;
};

export function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

export function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

export const generateRandomCode = () => {
    return Math.floor(Math.random() * 90000) + 10000;
};

// To add minutes to the current time
export const addMinutesToDate = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
};

export const dateFormatter = (date, format) => {
    const timezone = 'Asia/Jakarta';
    // Validate that the time zone is supported
    if (!moment.tz.zone(timezone)) {
        return RequestError('Unknown time zone: "' + timezone + '"');
    }
    // Use current date if not supplied
    date = date || new Date();
    // Use default format if not supplied
    format = format || 'YYYY-MM-DDTHH:mm:ssZZ';
    return moment(date).tz(timezone).format(format);
};

/**
 *
 * @param {String} password user password plain text
 * @returns {Promise} hash password
 */
export const hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('base64');

        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}.${derivedKey.toString('base64')}`);
        });
    });
};

/**
 *
 * @param {String} password user password plain text
 * @param {String} hash hash password
 * @param {String} salt salt password
 * @returns {Promise} true | false
 */
export const verifyPassword = async (password, hash, salt) => {
    return new Promise((resolve, reject) => {
        const key = hash.split('.')[1];
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key === derivedKey.toString('base64'));
        });
    });
};

export const toObjectId = (id) => {
    return new mongoose.Types.ObjectId(id);
};

export const getCurrentJakartaTime = () => {
    return moment.tz(Date.now(), 'Asia/Jakarta');
};

export const transformNestedObject = async (obj) => {
    console.log('obj', obj);
    const nestedObject = {};
    await lodash.forEach(obj, (value, key) => {
        lodash.set(nestedObject, key, value);
    });
    console.log('nestedObject', nestedObject);

    return nestedObject;
};

export const toTitleCase = (str) => {
    return str
        .split(' ')
        .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
        .join(' ');
};

export const checkInputTypeAutoLend = (
    // successTransaction,
    tenorLength,
    borrowingCategory,
    yieldRange,
    amountToLend,
    // cancelTime,
) => {
    // console.log('successTransaction', successTransaction);

    if (typeof amountToLend !== 'number') {
        throw new ValidationError('Amount to lend must be a number!');
    }

    // if (typeof cancelTime !== 'number') {
    //     throw new ValidationError('Cancel time must be a number!');
    // }

    if (typeof tenorLength !== 'undefined') {
        if (typeof tenorLength !== 'object') {
            throw new ValidationError(
                'Tenor length must be an object of start & end!',
            );
        }

        if (
            typeof tenorLength.start !== 'number' ||
            typeof tenorLength.end !== 'number'
        ) {
            throw new ValidationError(
                'tenorLength.start and tenorLength.end must be a number!',
            );
        }
    }

    // if (typeof successTransaction !== 'undefined') {
    //     if (typeof successTransaction !== 'string') {
    //         throw new ValidationError('Success transaction must be a string!');
    //     }
    // }

    if (typeof borrowingCategory !== 'undefined') {
        if (!Array.isArray(borrowingCategory)) {
            throw new ValidationError('Borrowing category must be an array!');
        }

        if (borrowingCategory.length < 1) {
            throw new ValidationError(
                'Borrowing category must have at least 1 item!',
            );
        }
    }

    if (typeof yieldRange !== 'undefined') {
        if (typeof yieldRange !== 'object') {
            throw new ValidationError(
                'Yield range must be an object of start & end!',
            );
        }

        if (
            typeof yieldRange.start !== 'number' ||
            typeof yieldRange.end !== 'number'
        ) {
            throw new ValidationError(
                'yieldRange.start and yieldRange.end must be a number!',
            );
        }
    }
};

/**
 * Validate request payload for required fields
 * @param {Object} payload - Object of request payload
 * @param {Array} requiredFields - Array of required fields
 * @returns {String} String of error fields
 */
export const validateRequestPayload = (payload, requiredFields = []) => {
    let errorFields = [];

    requiredFields.forEach((field) => {
        // if (typeof field === 'object') {
        //     if (Object.keys(field).length > 0) {
        //         for (const key in field) {
        //             if (!Object.hasOwn(field, key)) {
        //                 errorFields.push(key);
        //             } else {
        //                 if (!payload[key]) {
        //                     errorFields.push(key);
        //                 }
        //             }
        //         }
        //     }
        // }

        // if (!payload) {
        //     errorFields.push(field);
        // } else {
        if (!Object.hasOwn(payload, field)) {
            errorFields.push(field);
        } else {
            if (!payload[field]) {
                errorFields.push(field);
            }
        }
        // }
    });

    return errorFields.join(', ');

    // if (errorFields.length > 0) {
    //     return false, errorFields;
    //     // throw new ValidationError(
    //     //     `${errorFields.join(', ')} field(s) are required!`,
    //     // );
    // }

    // return true, errorFields;
};

export const getCurrentDateIndonesia = () => {
    var date = new Date();
    var tahun = date.getFullYear();
    var bulan = date.getMonth();
    var tanggal = date.getDate();
    var hari = date.getDay();
    var jam = date.getHours() >= 10 ? date.getHours() : `0${date.getHours()}`;
    var menit =
        date.getMinutes() >= 10 ? date.getMinutes() : `0${date.getMinutes()}`;
    var detik =
        date.getSeconds() >= 10 ? date.getSeconds() : `0${date.getSeconds()}`;
    switch (hari) {
        case 0:
            hari = 'Minggu';
            break;
        case 1:
            hari = 'Senin';
            break;
        case 2:
            hari = 'Selasa';
            break;
        case 3:
            hari = 'Rabu';
            break;
        case 4:
            hari = 'Kamis';
            break;
        case 5:
            hari = "Jum'at";
            break;
        case 6:
            hari = 'Sabtu';
            break;
    }
    switch (bulan) {
        case 0:
            bulan = 'Januari';
            break;
        case 1:
            bulan = 'Februari';
            break;
        case 2:
            bulan = 'Maret';
            break;
        case 3:
            bulan = 'April';
            break;
        case 4:
            bulan = 'Mei';
            break;
        case 5:
            bulan = 'Juni';
            break;
        case 6:
            bulan = 'Juli';
            break;
        case 7:
            bulan = 'Agustus';
            break;
        case 8:
            bulan = 'September';
            break;
        case 9:
            bulan = 'Oktober';
            break;
        case 10:
            bulan = 'November';
            break;
        case 11:
            bulan = 'Desember';
            break;
    }

    var dateString = hari + ', ' + tanggal + ' ' + bulan + ' ' + tahun;
    var time = jam + ':' + menit + ':' + detik;
    return { time, date: dateString };
};

export const formatRupiah = (angka, prefix = 'Rp. ') => {
    var number_string = angka
            .toString()
            .replace(/[^,\d]/g, '')
            .toString(),
        split = number_string.split(','),
        sisa = split[0].length % 3,
        rupiah = split[0].substr(0, sisa),
        ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    // tambahkan titik jika yang di input sudah menjadi angka ribuan
    if (ribuan) {
        const separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    return prefix == undefined ? rupiah : rupiah ? 'Rp. ' + rupiah : '';
};

// Function to encrypt the combined values
export const encryptCombinedValues = (combinedValues, encryptionKey) => {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);

    // Derive a 32-byte encryption key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
        encryptionKey,
        iv,
        10000,
        32,
        'sha256',
    );

    // Create a cipher using the encryption key and initialization vector
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);

    let encrypted = cipher.update(combinedValues, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return the encrypted values along with the initialization vector
    return {
        encryptedValues: encrypted,
        iv: iv.toString('hex'),
    };
};

/**
 * Remove keys from object and return new object without removed keys
 * @param {Object} obj
 * @param {Array} array of keys to be removed
 * @returns {Object} return object without removed keys
 */
export const omit = (obj, keys) => {
    if (typeof obj !== 'object') {
        return _.omit(JSON.parse(obj), keys);
    }
    return _.omit(obj, keys);
};

export const validateVerifyBorrowerRequest = (
    payload,
    personal,
    relativesContact,
) => {
    let errors = validateRequestPayload(payload, [
        'personal',
        'relativesContact',
    ]);

    if (errors.length > 0) {
        throw new ValidationError(`${errors} field(s) are required!`);
    }

    errors = validateRequestPayload(personal, [
        'fullName',
        'gender',
        'birthDate',
        'work',
        'idCardNumber',
    ]);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in personal are required!`,
        );
    }

    errors = validateRequestPayload(personal.work, ['name', 'salary']);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in personal.work are required!`,
        );
    }

    errors = validateRequestPayload(relativesContact, [
        'firstRelative',
        'secondRelative',
    ]);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in relativesContact are required!`,
        );
    }

    errors = validateRequestPayload(relativesContact.firstRelative, [
        'name',
        'relation',
        'phoneNumber',
    ]);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in relativesContact.firstRelative are required!`,
        );
    }

    errors = validateRequestPayload(relativesContact.secondRelative, [
        'name',
        'relation',
        'phoneNumber',
    ]);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in relativesContact.secondRelative are required!`,
        );
    }
};

export const validateVerifyLenderRequest = (payload, personal) => {
    let errors = validateRequestPayload(payload, ['personal']);

    if (errors.length > 0) {
        throw new ValidationError(`${errors} field(s) are required!`);
    }

    errors = validateRequestPayload(personal, [
        'fullName',
        'gender',
        'birthDate',
        'work',
        'idCardNumber',
    ]);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in personal are required!`,
        );
    }

    errors = validateRequestPayload(personal.work, ['name', 'salary']);

    if (errors.length > 0) {
        throw new ValidationError(
            `${errors} field(s) in personal.work are required!`,
        );
    }
};
