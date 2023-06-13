import mongoose from 'mongoose';
/**
 * - on request = borrower berhasil mengajukan pinjaman
 * - on process = pinjaman sedang didanai oleh lender namun belum semua jumlah terpenuhi
 * - in borrowing = pinjaman sedang berjalan / sedang didanai
 * - repayment = pinjaman sudah lunas / sudah selesai
 * - late repayment = pinjaman sudah lunas / sudah selesai tapi terlambat
 * - unpaid = pinjaman belum lunas / belum selesai
 */
// const statusOptions = {
//     type: String,
//     enum: [
//         'on request',
//         'on process',
//         'in borrowing',
//         'unpaid',
//         'repayment',
//         'late repayment',
//     ].concat([null]),
//     // default: null,
// };

const statusOptions = {
    type: String,
    enum: ['not verified', 'verified', 'pending'].concat([null]),
    // default: null,
};

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        status: statusOptions,
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'lenders',
    },
);

export default mongoose.model('Lenders', schema);
