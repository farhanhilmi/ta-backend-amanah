import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const tokenSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true },
        refreshToken: { type: String, required: true },
        createdDate: { type: Date, default: Date.now, expires: 30 * 86400 }, // 30 days
        // expiredDate: Date,
    },
    {
        collection: 'refresh_token',
    },
);

export default mongoose.model('RefreshToken', tokenSchema);
