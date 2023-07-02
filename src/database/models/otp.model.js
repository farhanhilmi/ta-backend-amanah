import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const otpSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true },
        otp: { type: String, required: true },
        expired: { type: String, required: true },
        // expiredDate: Date,
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'OTP',
    },
);

export default mongoose.model('OTP', otpSchema);
