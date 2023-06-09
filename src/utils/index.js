import mongoose from 'mongoose';
import _ from 'underscore';
import lodash from 'lodash';
import crypto from 'crypto';
import moment from 'moment-timezone';
import { RequestError } from './errorHandler.js';

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
    const nestedObject = {};
    await lodash.forEach(obj, (value, key) => {
        lodash.set(nestedObject, key, value);
    });

    return nestedObject;
};

export const toTitleCase = (str) => {
    return str
        .split(' ')
        .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
        .join(' ');
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

        if (!Object.hasOwn(payload, field)) {
            errorFields.push(field);
        } else {
            if (!payload[field]) {
                errorFields.push(field);
            }
        }
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
