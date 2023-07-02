import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        lenderId: {
            type: Schema.Types.ObjectId,
            ref: 'Lenders',
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
        collection: 'lender_contracts',
    },
);

export default mongoose.model('LenderContracts', schema);
