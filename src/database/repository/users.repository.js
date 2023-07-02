import _ from 'underscore';
import Users from '../models/users.model.js';

class UsersRepository {
    async createUser({ roles, name, email, password, salt, phoneNumber }) {
        const user = await Users.create({
            roles,
            name,
            email,
            password,
            salt,
            phoneNumber,
        });
        const result = JSON.stringify(user);
        return _.omit(JSON.parse(result), 'password', 'salt', '__v');
    }

    async find({
        query,
        projection = { __v: 0, salt: 0 },
        sort = { createdDate: 1 },
        options = {},
    }) {
        return await Users.find(query, projection, options)
            .sort(sort)
            .select({ __v: 0 })
            .exec();
    }

    async findById(id, projection = { __v: 0, salt: 0 }, options = {}) {
        return await Users.findById(id, projection, options).exec();
    }

    async findOne(query, projection = { __v: 0, salt: 0 }, options = {}) {
        return await Users.findOne(query, projection, options).exec();
    }

    async updateUserById(
        id,
        { roles, name, email, password },
        options = { new: true },
    ) {
        const payload = { roles, name, email, password };
        return await Users.findByIdAndUpdate(id, payload, options).exec();
    }

    async updatePasswordByUserId(
        id,
        newPassword,
        salt,
        options = { new: true },
    ) {
        const payload = { password: newPassword, salt };
        return await Users.findOneAndUpdate(
            { _id: id },
            payload,
            options,
        ).exec();
    }

    async updateVerifiedUser(id, verified, options = { new: true }) {
        return await Users.findByIdAndUpdate(id, { verified }, options).exec();
    }

    async updateSalt(id, salt, options = { new: true }) {
        return await Users.findByIdAndUpdate(id, { salt }, options).exec();
    }

    async deleteUser(id) {
        return await Users.findByIdAndDelete(id).exec();
    }

    async isUserExist(email) {
        return await Users.exists({ email }).exec();
    }
}

export default UsersRepository;
