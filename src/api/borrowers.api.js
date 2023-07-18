import { responseData } from '../utils/responses.js';
// import subscribeEvents from '../services/subscribeEvents.js';
import BorrowerService from '../services/borrower.service.js';

export default class BorrowerController {
    constructor() {
        // this.channel = channel;
        // To listen
        // SubscribeMessage(subscribeEvents, 'Borrower');
        this.borrowerService = new BorrowerService();
    }

    async getProfile(req, res, next) {
        try {
            const { userId } = req.user;
            // const { userId, roles } = JSON.parse(req.header('user'));
            const data = await this.borrowerService.getBorrowerProfile(userId);
            res.status(200).json(responseData(data));
        } catch (error) {
            next(error);
        }
    }

    async postRequestLoan(req, res, next) {
        try {
            const { userId, roles } = req.user;
            const payload = req.body;
            await this.borrowerService.requestLoan({ userId, roles }, payload);

            res.status(201).json(
                responseData(
                    [],
                    true,
                    'Loan request sent! Please check accordingly in your dashboard and your email for further information!',
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async putVerifyBorrower(req, res, next) {
        try {
            const { userId, roles } = req.user;

            const payload = {
                ...req.body,

                // fileName: req.uploadedFileName,
            };

            await this.borrowerService.requestVerifyBorrower(
                userId,
                payload,
                req.files,
            );

            res.status(200).json(
                responseData(
                    [],
                    true,
                    'Request to verify borrower successfully. Please wait for admin to verify your request.',
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async getLoanHistory(req, res, next) {
        try {
            const { userId, roles } = req.user;

            const data = await this.borrowerService.getLoanHistory(
                userId,
                roles,
            );

            res.status(200).json(
                responseData(data, true, 'Successfully get loan history!'),
            );
        } catch (error) {
            next(error);
        }
    }

    async getFundDisbursement(req, res, next) {
        try {
            const { userId } = req.user;

            const data = await this.borrowerService.getFundDisbursement(userId);

            res.status(200).json(responseData(data, true, 'Successfully!'));
        } catch (error) {
            next(error);
        }
    }

    async postFundDisbursement(req, res, next) {
        try {
            const { userId } = req.user;

            const data = await this.borrowerService.postFundDisbursement(
                userId,
                req.body,
                req.files,
            );

            res.status(200).json(responseData(data, true, 'Successfully!'));
        } catch (error) {
            next(error);
        }
    }

    async getPaymentSchedule(req, res, next) {
        try {
            const { userId } = req.user;

            const data = await this.borrowerService.getPaymentSchedule(userId);

            res.status(200).json(
                responseData(data, true, 'Successfully get payment schedule'),
            );
        } catch (error) {
            next(error);
        }
    }

    async postRepayment(req, res, next) {
        try {
            const { userId } = req.user;

            const data = await this.borrowerService.postRepayment(
                userId,
                req.body,
            );

            res.status(200).json(responseData(data, true, 'Successfully'));
        } catch (error) {
            next(error);
        }
    }
}
