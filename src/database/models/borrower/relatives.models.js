import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const relativesOptions = {
    name: {
        type: String,
        required: 'Name is required!',
        default: false,
    },
    relation: {
        type: String,
        required: 'Relation is required!',
        default: false,
    },
    phoneNumber: {
        type: Number,
        required: 'Phone Number is required!',
        default: false,
    },
};

const schema = new mongoose.Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
        },
        firstRelative: relativesOptions,
        secondRelative: relativesOptions,
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'relatives',
    },
);

// schema.virtual('adjustedTime').get(function () {
//     return moment.tz(this.sentTime, 'Asia/Jakarta').format();
// });

export default mongoose.model('Relatives', schema);
