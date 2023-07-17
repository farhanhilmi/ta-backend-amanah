import mongoose from 'mongoose';
// import moment from 'moment-timezone';

/**
 * - on request = borrower berhasil mengajukan pinjaman
 * - on process = pinjaman sedang didanai oleh lender namun belum semua jumlah terpenuhi
 * - in borrowing = pinjaman sedang berjalan / sedang didanai
 * - disbursement = pinjaman sedang berjalan / sudah dicairkan
 * - repayment = pinjaman sudah lunas / sudah selesai
 * - late repayment = pinjaman sudah lunas / sudah selesai tapi terlambat
 * - unpaid = pinjaman belum lunas / belum selesai
 */
const statusOptions = {
    type: String,
    enum: [
        // 'underwriting',
        'on request',
        'on process',
        'in borrowing',
        'disbursement',
        'unpaid',
        'repayment',
        'late repayment',
    ],
    default: 'on request',
};

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        borrowerId: {
            type: Schema.Types.ObjectId,
            ref: 'Borrowers',
            required: true,
        },
        purpose: {
            type: String,
        },
        amount: {
            type: Number,
        },

        tenor: {
            type: Number,
        },
        borrowingCategory: {
            type: String,
        },
        yieldReturn: {
            type: Number,
        },
        paymentSchema: {
            type: String,
        },
        creditScore: {
            type: String,
            default: null,
        },
        // contractLink: {
        //     type: String,
        //     default: null,
        // },
        status: statusOptions,
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'loans',
    },
);

schema.virtual('user', {
    ref: 'Users',
    localField: 'userId',
    foreignField: '_id',
});

export default mongoose.model('Loans', schema);
