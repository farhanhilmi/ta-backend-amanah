import mongoose from 'mongoose';
// import moment from 'moment-timezone';

/**
 * - on request = borrower berhasil mengajukan pinjaman
 * - on process = pinjaman sedang didanai oleh lender namun belum semua jumlah terpenuhi
 * - in borrowing = pinjaman sedang berjalan / sedang didanai // sudah penuh
 * - repayment = pinjaman sudah lunas / sudah selesai
 * - late repayment = pinjaman sudah lunas / sudah selesai tapi terlambat
 * - unpaid = pinjaman belum lunas / belum selesai
 */
const statusOptions = {
    type: String,
    enum: ['waiting', 'matched', 'in borrowing', 'done'],
    default: 'waiting',
};

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        cancelTime: {
            type: Date,
            default: null,
        },
        tenorLength: {
            type: Object,
            default: null,
        },
        borrowingCategory: {
            type: Array,
            default: null,
        },
        yieldRange: {
            type: Object,
            default: null,
        },
        status: statusOptions,
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'auto_lend',
    },
);

schema.virtual('user', {
    ref: 'Users',
    localField: 'userId',
    foreignField: '_id',
});

export default mongoose.model('AutoLend', schema);
