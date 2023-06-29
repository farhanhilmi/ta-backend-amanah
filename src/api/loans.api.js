import LoanService from '../services/loan.service.js';
import { responseData } from '../utils/responses.js';

// import userServices from '../services/index.js';
export class LoansController {
    constructor() {
        // this.channel = channel;
        // SubscribeMessage(subscribeEvents, 'Loan');
        this.loanService = new LoanService();
    }

    // async loanCheck(req, res, next) {
    //     try {
    //         const { userId, idCard } = req.params;
    //         // const { userId, roles } = JSON.parse(req.header('user'));
    //         const data = await checkLoanStatus(userId, idCard);
    //         // io.emit(`notification#${userId}`, data);
    //         res.status(200).json(data);
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    async getAllAvailableLoans(req, res, next) {
        try {
            // const { page, limit, sort, order } = req.query;
            const data = await this.loanService.showAvailableLoans(req.query);
            // io.emit(`notification#${userId}`, data);
            res.status(200).json(
                responseData(
                    data.data,
                    'OK',
                    'fetching all available loans success',
                    data.meta,
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async getLoanById(req, res, next) {
        try {
            // const { page, limit, sort, order } = req.query;
            const data = await this.loanService.getLoanDetails(
                req.params.loanId,
            );
            // io.emit(`notification#${userId}`, data);
            res.status(200).json(
                responseData(data, 'OK', 'fetching loan details success', {}),
            );
        } catch (error) {
            next(error);
        }
    }

    async getLoanRecommendation(req, res, next) {
        try {
            // const { page, limit, sort, order } = req.query;
            const data = await this.loanService.getLoanRecommendation(
                req.user.userId,
            );
            // io.emit(`notification#${userId}`, data);
            res.status(200).json(responseData(data, 'OK', 'success', {}));
        } catch (error) {
            next(error);
        }
    }
}
