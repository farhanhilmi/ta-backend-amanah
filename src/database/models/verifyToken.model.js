import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true },
        token: { type: String, required: true },
        createdDate: { type: Date, default: Date.now },
    },
    {
        collection: 'verify_email_token',
    },
);

export default mongoose.model('VerifyToken', schema);
