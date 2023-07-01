import { responseData } from '../utils/responses.js';
// import subscribeEvents from '../services/subscribeEvents.js';
import AdminService from '../services/admin.service.js';

export default class AdminController {
    constructor() {
        this.adminService = new AdminService();
    }

    async getRequestKYC(req, res, next) {
        try {
            // const { userId } = req.user;
            const data = await this.adminService.getRequestKYC();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async postApproveKYC(req, res, next) {
        try {
            const data = await this.adminService.approveKYC(req.body);
            res.status(200).json(responseData([], true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const data = await this.adminService.getUsers();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async getAllLoansData(req, res, next) {
        try {
            const data = await this.adminService.getAllLoans();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async getAllFundingsData(req, res, next) {
        try {
            const data = await this.adminService.getAllFundings();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async getCounts(req, res, next) {
        try {
            const data = await this.adminService.getCounts();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async getCountLoanFunding(req, res, next) {
        try {
            const data = await this.adminService.countLoanFundings(req.query);
            res.status(200).json(
                responseData(data.data, true, 'Success', data.meta),
            );
        } catch (error) {
            next(error);
        }
    }

    async getMostBorrowedCategory(req, res, next) {
        try {
            const data = await this.adminService.mostBorrowedCategory();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }

    async getAutoLendData(req, res, next) {
        try {
            const data = await this.adminService.getAutoLend();
            res.status(200).json(responseData(data, true, 'Success'));
        } catch (error) {
            next(error);
        }
    }
}
