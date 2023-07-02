import mongoose from 'mongoose';
// import moment from 'moment-timezone';

/**
 * - on request = borrower berhasil mengajukan pinjaman
 * - on process = pinjaman sedang didanai oleh lender namun belum semua jumlah terpenuhi
 * - in borrowing = pinjaman sedang berjalan / sedang didanai
 * - repayment = pinjaman sudah lunas / sudah selesai
 * - late repayment = pinjaman sudah lunas / sudah selesai tapi terlambat
 * - unpaid = pinjaman belum lunas / belum selesai
 */
const statusOptions = {
    type: String,
    enum: [
        'on request',
        'on process',
        'in borrowing',
        'unpaid',
        'repayment',
        'late repayment',
    ],
    default: 'on request',
};

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        // borrowerId: {
        //     // lender
        //     type: Schema.Types.ObjectId,
        //     ref: 'Borrowers',
        //     required: true,
        // },
        // lenderIds: [
        //     {
        //         // lender
        //         type: Schema.Types.ObjectId,
        //         ref: 'Lenders',
        //         required: true,
        //     },
        // ],
        loanId: {
            type: Schema.Types.ObjectId,
            ref: 'Loans',
            required: true,
        },
        paymentSchedule: [
            {
                date: {
                    type: Date,
                },
                amount: {
                    type: Number,
                },
                status: {
                    type: String,
                    enum: ['paid', 'unpaid', 'late paid'],
                    default: 'unpaid',
                },
            },
        ],
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'payments',
    },
);

export default mongoose.model('Payment', schema);
