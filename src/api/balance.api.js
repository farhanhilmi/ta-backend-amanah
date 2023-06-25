import { responseData } from '../utils/responses.js';
// import subscribeEvents from '../services/subscribeEvents.js';
import BalanceService from '../services/balance.service.js';

export default class BorrowerController {
    constructor() {
        this.balanceService = new BalanceService();
    }

    async getBankAccount(req, res, next) {
        try {
            const { userId } = req.user;
            const data = await this.balanceService.getBankAccount(userId);
            res.status(200).json(
                responseData(data, true, 'Success get bank account'),
            );
        } catch (error) {
            next(error);
        }
    }

    async getBalance(req, res, next) {
        try {
            const { userId } = req.user;
            const data = await this.balanceService.getBalance(userId);
            res.status(200).json(
                responseData(data, true, 'success get balance'),
            );
        } catch (error) {
            next(error);
        }
    }

    async getVA(req, res, next) {
        try {
            const { userId } = req.user;
            const data = await this.balanceService.getVirtualAccount(userId);
            res.status(200).json(
                responseData(data, true, 'success get virtual account'),
            );
        } catch (error) {
            next(error);
        }
    }

    async addBankAccount(req, res, next) {
        try {
            const { userId } = req.user;
            await this.balanceService.addBankAccount(userId, req.body);
            res.status(200).json(
                responseData([], true, 'Success add new bank account'),
            );
        } catch (error) {
            next(error);
        }
    }

    async inquireBankAccount(req, res, next) {
        try {
            const payload = req.query;
            await this.balanceService.validateBankAccount(payload);
            res.status(200).json(
                responseData([], true, 'Success validate bank account'),
            );
        } catch (error) {
            next(error);
        }
    }

    async withdrawBalance(req, res, next) {
        try {
            const { userId } = req.user;
            await this.balanceService.withdrawBalance(userId, req.body);
            res.status(200).json(
                responseData([], true, 'Success withdraw balance'),
            );
        } catch (error) {
            next(error);
        }
    }

    async updateBankAccount(req, res, next) {
        try {
            const { userId } = req.user;
            await this.balanceService.updateBankAccount(userId, req.body);
            res.status(200).json(
                responseData([], true, 'Success update bank account'),
            );
        } catch (error) {
            next(error);
        }
    }

    async depositBalance(req, res, next) {
        try {
            const { userId } = req.user;
            const data = await this.balanceService.topUpBalance(
                userId,
                req.body,
            );
            res.status(200).json(
                responseData(data, true, 'Success top up balance'),
            );
        } catch (error) {
            next(error);
        }
    }

    async getBankInfo(req, res, next) {
        try {
            const data = await this.balanceService.getAvailableBankInfo();
            res.status(200).json(responseData(data, true, 'Success get data'));
        } catch (error) {
            next(error);
        }
    }
}
