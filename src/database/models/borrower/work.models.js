import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const addressData = {
    province: {
        type: String,
        default: null,
    },
    city: {
        type: String,
        default: null,
    },
    postalCode: {
        type: String,
        default: null,
    },
    detail: {
        type: String,
        default: null,
    },
};

const schema = new Schema(
    {
        borrowerId: {
            type: Schema.Types.ObjectId,
            ref: 'Borrowers',
            required: true,
        },
        companyName: {
            type: String,
            default: null,
        },
        position: {
            type: String,
            default: null,
        },
        salary: {
            type: String,
            default: null,
        },
        joinDate: {
            type: Date,
            default: null,
        },
        companyPhoneNumber: {
            type: String,
            default: null,
        },
        address: addressData,
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'work',
    },
);

export default mongoose.model('Work', schema);
