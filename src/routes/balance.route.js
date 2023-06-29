import { Router } from 'express';
import BalanceController from '../api/balance.api.js';
import {
    authenticateToken,
    isBorrower,
    isLender,
    // isKYCVerified,
} from '../middleware/authentication.js';

const Routes = () => {
    const router = Router();
    const controller = new BalanceController();
    // router.get(
    //     '/profile',
    //     authenticateToken,
    //     controller.getProfile.bind(controller),
    // );

    router.get(
        '/',
        authenticateToken,
        isLender,
        // isKYCVerified,
        controller.getBalance.bind(controller),
    );

    router.get(
        '/va',
        authenticateToken,
        isLender,
        // isKYCVerified,
        controller.getVA.bind(controller),
    );

    router.post(
        '/deposit',
        authenticateToken,
        isLender,
        // isKYCVerified,
        controller.depositBalance.bind(controller),
    );

    router.post(
        '/withdraw',
        authenticateToken,
        isLender,
        // isKYCVerified,
        controller.withdrawBalance.bind(controller),
    );

    router.get(
        '/account',
        authenticateToken,
        // isLender,
        // isKYCVerified,
        controller.getBankAccount.bind(controller),
    );

    router.post(
        '/account',
        authenticateToken,
        // isLender,
        // isKYCVerified,
        controller.addBankAccount.bind(controller),
    );

    router.delete(
        '/account',
        authenticateToken,
        // isLender,
        // isKYCVerified,
        controller.deleteBankAccount.bind(controller),
    );

    router.get(
        '/banks',
        authenticateToken,
        controller.getBankInfo.bind(controller),
    );

    router.get(
        '/account/validation',
        authenticateToken,
        // isLender,
        // isKYCVerified,
        controller.inquireBankAccount.bind(controller),
    );

    router.get(
        '/transaction/history',
        authenticateToken,
        // isLender,
        // isKYCVerified,
        controller.getTransactionHistory.bind(controller),
    );

    router.put(
        '/account',
        authenticateToken,
        // isLender,
        // isKYCVerified,
        controller.updateBankAccount.bind(controller),
    );

    return router;
};

export default Routes;
