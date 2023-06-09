import {
    CredentialsError,
    NotFoundError,
    ValidationError,
} from '../../utils/errorHandler.js';
import { hashPassword } from '../../utils/index.js';
import UsersRepository from '../../database/repository/users.repository.js';
import forgetToken from '../../database/models/forgetToken.model.js';
import bcrypt from 'bcrypt';

const userRepo = new UsersRepository();
export default async (payload) => {
    const { email, newPassword, token } = payload;
    if (!email) throw new ValidationError('Email is required!');
    if (!newPassword) throw new ValidationError('New Password is required!');

    const user = await userRepo.findOne({ email });
    if (!user) throw new NotFoundError('User with this email not found!');
    const passwordResetToken = await forgetToken.findOne({
        userId: user._id,
    });
    const isValid = await bcrypt.compare(token, passwordResetToken.token);

    if (!isValid) {
        throw new CredentialsError('Invalid or expired password reset token');
    }

    const hash = await hashPassword(newPassword);
    const salt = hash.split('.')[0];
    const updatedUser = await userRepo.updatePasswordByUserId(
        user._id,
        hash,
        salt,
    );
    await forgetToken.deleteMany({ userId: user._id });

    return {
        userId: updatedUser._id,
        email: updatedUser.email,
        roles: updatedUser.roles,
        name: updatedUser.name,
    };
};
