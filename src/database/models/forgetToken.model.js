import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const forgetPassSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true },
        token: { type: String, required: true },
        createdDate: { type: Date, default: Date.now },
    },
    {
        collection: 'forget_password_token',
    },
);

export default mongoose.model('ForgetPassword', forgetPassSchema);
