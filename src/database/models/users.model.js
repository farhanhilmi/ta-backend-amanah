import mongoose from 'mongoose';
// import moment from 'moment-timezone';

const roleOptions = {
    type: String,
    enum: ['lender', 'borrower', 'admin'],
    // default: ['lender'],
};

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: 'Name is required!',
            minlength: 3,
        },
        email: {
            type: String,
            required: 'Email is required!',
            unique: true,
        },
        phoneNumber: {
            type: String,
            required: 'Phone Number is required!',
        },
        password: {
            type: String,
            minlength: 5,
            required: 'Password is required!',
        },
        salt: {
            type: String,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        roles: roleOptions,
        birthDate: {
            type: String,
            default: false,
        },
        gender: {
            type: String,
            default: false,
        },
        idCardNumber: {
            type: Number,
            default: false,
        },
        idCardImage: {
            type: String,
            default: false,
        },
        faceImage: {
            type: String,
            default: false,
        },
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'users',
    },
);

// schema.virtual('adjustedTime').get(function () {
//     return moment.tz(this.sentTime, 'Asia/Jakarta').format();
// });

// Duplicate the ID field.
schema.virtual('userId').get(function () {
    return this._id.toHexString();
});

// userSchema.method('toClient', function () {
//     var obj = this.toObject();

//     //Rename fields
//     obj.userId = obj._id;
//     delete obj._id;

//     return obj;
// });

export default mongoose.model('Users', schema);
