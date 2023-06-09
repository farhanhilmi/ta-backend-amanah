import OTPModel from '../models/otp.model.js';

export default class OTPRepository {
    constructor() {
        this.model = OTPModel;
    }

    async findOne(query, projection = { __v: 0 }, options = {}) {
        return await this.model.findOne(query, projection, options).exec();
    }

    async create(userId, otp, expired) {
        return await this.model.create({
            userId,
            otp,
            expired,
        });
    }

    async updateOTPByUserId(userId, { otp, expired }) {
        // const payload = { otp, expired };
        const query = { userId },
            update = { otp, expired },
            options = { upsert: true, new: true, setDefaultsOnInsert: true };

        // Find the document
        return await this.model.findOneAndUpdate(
            query,
            update,
            options,
            // function (error, result) {
            //     if (error) return;

            //     // do something with the document
            // },
        );
        // return this.model.updateOne({ userId }, payload, options);
    }

    async deleteOTP(userId) {
        return await this.model.findOneAndDelete({ userId });
    }
}
