import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        borrowerId: {
            type: Schema.Types.ObjectId,
            ref: 'Borrowers',
            required: true,
        },
        loanId: {
            type: Schema.Types.ObjectId,
            ref: 'Loans',
        },
        signatureKey: {
            type: String,
        },
        // lenderIds: {
        //     type: [Schema.Types.ObjectId],
        //     ref: 'Lenders',
        //     default: [],
        // },
        contractLink: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'createdDate', updatedAt: 'modifyDate' },
        collection: 'borrower_contracts',
    },
);

export default mongoose.model('BorrowerContracts', schema);
