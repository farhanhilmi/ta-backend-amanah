import mongoose from 'mongoose';
import _ from 'underscore';
import lodash from 'lodash';

export const toObjectId = (id) => {
    return new mongoose.Types.ObjectId(id);
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
