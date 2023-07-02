import RefreshToken from '../models/refreshToken.model.js';

export default class RefreshTokenRepository {
    constructor() {
        this.model = RefreshToken;
    }

    async findOne(query, projection = { __v: 0 }, options = {}) {
        return await this.model.findOne(query, projection, options).exec();
    }

    async create(userId, refreshToken) {
        return await this.model.create({
            userId,
            refreshToken,
        });
    }
}
