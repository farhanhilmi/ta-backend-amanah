import OTPRepository from '../../database/repository/otp.repository.js';
import { CredentialsError, RequestError } from '../../utils/errorHandler.js';
import { dateFormatter } from '../../utils/index.js';

const otpRepo = new OTPRepository();

export default async (otp, userId) => {
    // const { otp, userId } = payload;
    // const requiredField = { otp, userId };

    // const { error, errorFields } = validateData({
    //     requiredField,
    //     data: payload,
    // });

    // if (error) {
    //     throw new ValidationError(`${errorFields} is required!`);
    // }
    // const user = await this.usersRepo.findOne({ email });
    // if (user?.verified) {
    //     throw new ValidationError('Sudah terverifikasi');
    // }
    const dataOTP = await otpRepo.findOne({ userId });

    if (!dataOTP) {
        throw new CredentialsError(
            'We cannot find your OTP code. Please try again!',
        );
    }

    const newDate = dateFormatter(new Date());
    // console.log('newDate', newDate);
    // console.log('dataOTP', dataOTP);

    if (newDate > dataOTP.expired) {
        throw new RequestError('OTP Code is expired');
    }

    if (otp != dataOTP?.otp) {
        throw new CredentialsError(
            "OTP code doesn't match. Please check again!",
        );
    }
    await otpRepo.deleteOTP(userId);

    return true;
};
