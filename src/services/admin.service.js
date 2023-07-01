import usersModel from '../database/models/users.model.js';
import AdminRepository from '../database/repository/admin.repository.js';
import {
    AuthorizeError,
    NotFoundError,
    ValidationError,
} from '../utils/errorHandler.js';
import { validateRequestPayload, verifyPassword } from '../utils/index.js';
import lenderModel from '../database/models/lender/lender.model.js';
import borrowerModel from '../database/models/borrower/borrower.models.js';
import loansModels from '../database/models/loan/loans.models.js';
import fundingModels from '../database/models/loan/funding.models.js';
import { returnDataPagination } from '../utils/responses.js';
import autoLendModels from '../database/models/loan/autoLend.models.js';
import { generateTokens } from '../utils/jwtToken.js';

export default class AdminService {
    constructor() {
        this.usersModel = usersModel;
        this.adminRepository = new AdminRepository();
        this.lendersModel = lenderModel;
        this.borrowersModel = borrowerModel;
        this.loansModel = loansModels;
        this.fundingModel = fundingModels;
        this.autoLendModel = autoLendModels;
    }

    async login(payload) {
        try {
            const { email, password } = payload;
            const requiredField = { email, password };
            const errors = validateRequestPayload(requiredField, [
                'email',
                'password',
            ]);
            if (errors) {
                throw new ValidationError(
                    `${errorFields} field(s) is required!`,
                );
            }

            const user = await this.usersModel.findOne({ email }, { __v: 0 });
            if (!user)
                throw new NotFoundError(
                    'Your account is not registered. Please register your account first.',
                );

            if (!(await verifyPassword(password, user.password, user.salt))) {
                throw new AuthorizeError('Password incorrect!');
            }

            const { accessToken, refreshToken } = await generateTokens(user);

            return {
                data: { accessToken, refreshToken },
                message: 'Login success',
            };
        } catch (error) {
            throw error;
        }
    }

    async getRequestKYC() {
        try {
            return await this.adminRepository.findAllKycRequest();
        } catch (error) {
            throw error;
        }
    }

    async approveKYC(payload) {
        try {
            const errors = validateRequestPayload(payload, [
                'userId',
                'status',
            ]);
            if (errors.length > 0) {
                throw new ValidationError(`${errors} field(s) is required`);
            }

            const { userId, status, message } = payload;

            if (!['approved', 'rejected'].includes(status)) {
                throw new ValidationError(
                    `status must be approved or rejected`,
                );
            }

            if (status === 'rejected' && !message) {
                throw new ValidationError(
                    `message is required when status is rejected`,
                );
            }

            const user = await this.usersModel.findOne(
                { _id: userId },
                { _id: 1, roles: 1, email: 1 },
            );
            if (!user) {
                throw new NotFoundError(`user not found`);
            }

            let verifiedStatus = '';
            if (status === 'approved') {
                verifiedStatus = 'verified';
            } else {
                verifiedStatus = 'not verified';
            }

            if (user.roles === 'lender') {
                await this.lendersModel.findOneAndUpdate(
                    { userId },
                    { status: verifiedStatus },
                );
            } else if (user.roles === 'borrower') {
                await this.borrowersModel.findOneAndUpdate(
                    { userId },
                    { status: verifiedStatus },
                );
            }

            // *TODO: SEND EMAIL ABOUT VERIFICATION STATUS TO USER WITH MESSAGE

            return true;
        } catch (error) {
            throw error;
        }
    }

    async getUsers() {
        try {
            const users = await this.usersModel
                .aggregate([
                    {
                        $addFields: {
                            userId: '$_id',
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            salt: 0,
                            password: 0,
                            modifyDate: 0,
                            __v: 0,
                        },
                    },
                ])
                .exec();
            return users;
        } catch (error) {
            throw error;
        }
    }

    async getAllLoans() {
        try {
            return await this.adminRepository.findAllLoans();
        } catch (error) {
            throw error;
        }
    }

    async getAllFundings() {
        try {
            return await this.adminRepository.findAllFundings();
        } catch (error) {
            throw error;
        }
    }

    async getCounts() {
        try {
            const loans = await this.loansModel.countDocuments();
            const fundings = await this.fundingModel.countDocuments();

            // sum of all funding amount
            const totalFunding = await this.fundingModel
                .aggregate([
                    {
                        $group: {
                            _id: null,
                            totalFunding: { $sum: '$amount' },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalFunding: 1,
                        },
                    },
                ])
                .exec();

            const totalLoans = await this.loansModel
                .aggregate([
                    {
                        $group: {
                            _id: null,
                            totalLoans: { $sum: '$amount' },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalLoans: 1,
                        },
                    },
                ])
                .exec();

            return {
                loans,
                fundings,
                totalFunding:
                    totalFunding.length > 0 ? totalFunding[0].totalFunding : 0,
                totalLoans:
                    totalLoans.length > 0 ? totalLoans[0].totalLoans : 0,
            };
        } catch (error) {
            throw error;
        }
    }

    async countLoanFundings(params) {
        try {
            let { page, limit, sort, order } = params;

            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            sort = sort || 'totalAmount';
            order = order || 'desc';
            const sortOrder = order === 'asc' ? 1 : -1;

            const { borrower, lender } =
                await this.adminRepository.findTotalLoanFunding(
                    page,
                    limit,
                    sort,
                    sortOrder,
                );
            return returnDataPagination(
                { borrower, lender },
                null,
                {
                    page,
                    limit,
                    sort,
                    order,
                },
                '/admin/counts/transaction',
            );
        } catch (error) {}
    }

    async mostBorrowedCategory() {
        try {
            const loans = await this.loansModel.aggregate([
                {
                    $group: {
                        _id: '$borrowingCategory',
                        total: { $sum: 1 },
                    },
                },
                {
                    $addFields: {
                        borrowingCategory: '$_id',
                    },
                },
                {
                    $project: {
                        _id: 0,
                    },
                },
            ]);
            return loans;
        } catch (error) {
            throw error;
        }
    }

    async getAutoLend() {
        try {
            const autoLend = await this.autoLendModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'users',
                    },
                },
                {
                    $unwind: '$users',
                },
                {
                    $addFields: {
                        autoLendId: '$_id',
                        'user.userId': '$users._id',
                        'user.name': '$users.name',
                        'user.email': '$users.email',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        modifyDate: 0,
                        __v: 0,
                        userId: 0,
                        users: 0,
                        cancelTime: 0,
                    },
                },
            ]);
            return autoLend;
        } catch (error) {
            throw error;
        }
    }
}
