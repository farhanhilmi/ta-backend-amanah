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
    enum: ['pending', 'done', 'cancel'].concat([null]),
    // default: null,
};

const typeOptions = {
    type: String,
    enum: ['Withdraw', 'Deposit', 'Disbursement', 'Repayment'].concat([null]),
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
        repaymentId: {
            type: String,
            default: null,
        },
        transactionId: {
            type: String,
            required: true,
        },
        status: statusOptions,
        type: typeOptions,
        amount: {
            type: String,
            required: true,
        },
        // account: [
        //     {
        //         bank: String,
        //         va_number: String,
        //     },
        // ],
        transactionTime: {
            type: String,
            // required: true,
            default: null,
        },
        paymentLink: {
            type: String,
            default: null,
            // required: true,
        },
        // virtualAccount: [
        //     {
        //         idVA: String,
        //         bankFullName: String,
        //         bankCode: String,
        //         virtualAccountNumber: String,
        //     },
        // ],
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'transaction',
    },
);

export default mongoose.model('Transaction', schema);
