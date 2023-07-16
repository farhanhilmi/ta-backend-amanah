import LenderService from '../services/lender.service.js';
import { responseData } from '../utils/responses.js';

// import userServices from '../services/index.js';
export class LenderController {
    constructor() {
        this.lenderServices = new LenderService();
    }

    async postAutoLend(req, res, next) {
        try {
            const { userId, roles } = req.user;
            // const { page, limit, sort, order } = req.query;
            await this.lenderServices.createAutoLend(userId, req.body);
            // io.emit(`notification#${userId}`, data);
            res.status(201).json(
                responseData(
                    [],
                    true,
                    'Auto Lend has been created. When the auto lend matches a loan, the loan will be automatically funded. We will send you a notification when this happens via your email.',
                    {},
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async getAutoLend(req, res, next) {
        try {
            const { userId } = req.user;
            // const { page, limit, sort, order } = req.query;
            const data = await this.lenderServices.getAutoLendStatus(userId);
            // io.emit(`notification#${userId}`, data);
            res.status(200).json(responseData(data, true, 'Success', {}));
        } catch (error) {
            next(error);
        }
    }

    async deleteAutoLend(req, res, next) {
        try {
            // const { userId } = req.user;
            // const { page, limit, sort, order } = req.query;
            await this.lenderServices.deleteAutoLend(req.params.autoLendId);
            // io.emit(`notification#${userId}`, data);
            res.status(200).json(responseData([], true, 'Success', {}));
        } catch (error) {
            next(error);
        }
    }

    async postFundingLoan(req, res, next) {
        try {
            const { userId, roles } = req.user;
            const user = {
                userId,
                roles,
            };
            const contractLink = await this.lenderServices.createFundings(
                user,
                req.body,
            );

            res.status(201).json(
                responseData({ contract: contractLink }, true, 'Success', {}),
            );
        } catch (error) {
            next(error);
        }
    }

    async getLender(req, res, next) {
        try {
            const { userId, roles } = req.user;

            const data = await this.lenderServices.getLenderProfile(userId);
            res.status(200).json(responseData(data, true, 'success', {}));
        } catch (error) {
            next(error);
        }
    }

    async getProfit(req, res, next) {
        try {
            const data = await this.lenderServices.getLenderProfit(
                req.user.userId,
            );
            res.status(200).json(
                responseData(data, true, 'Success get lender profit', {}),
            );
        } catch (error) {
            next(error);
            // throw error;
        }
    }

    async getPortfolio(req, res, next) {
        try {
            const data = await this.lenderServices.getPortfolio(
                req.user.userId,
                req.params,
            );
            res.status(200).json(
                responseData(data, true, 'Success get lender profit', {}),
            );
        } catch (error) {
            next(error);
            // throw error;
        }
    }

    async verifyKYC(req, res, next) {
        try {
            const { userId } = req.user;

            const payload = {
                ...req.body,

                // fileName: req.uploadedFileName,
            };

            await this.lenderServices.requestVerifyLender(
                userId,
                payload,
                req.files,
            );

            res.status(200).json(
                responseData(
                    [],
                    true,
                    'Request to verify KYC successfully. Please wait for admin to verify your request.',
                ),
            );
        } catch (error) {
            next(error);
            // throw error;
        }
    }
}
