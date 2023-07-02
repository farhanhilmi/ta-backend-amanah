import { Router } from 'express';
import AdminController from '../api/admin.api.js';
import {
    authenticateToken,
    isAdmin,
    // isKYCVerified,
} from '../middleware/authentication.js';

const Routes = () => {
    const router = Router();
    const controller = new AdminController();

    router.get(
        '/users/kyc',
        authenticateToken,
        isAdmin,
        controller.getRequestKYC.bind(controller),
    );
    router.post(
        '/users/kyc',
        authenticateToken,
        isAdmin,
        controller.postApproveKYC.bind(controller),
    );

    router.get(
        '/users',
        authenticateToken,
        isAdmin,
        controller.getAllUsers.bind(controller),
    );

    router.get(
        '/loans',
        authenticateToken,
        isAdmin,
        controller.getAllLoansData.bind(controller),
    );

    router.get(
        '/fundings',
        authenticateToken,
        isAdmin,
        controller.getAllFundingsData.bind(controller),
    );

    router.get(
        '/counts',
        // authenticateToken,
        controller.getCounts.bind(controller),
    );

    router.get(
        '/counts/transaction',
        // authenticateToken,
        controller.getCountLoanFunding.bind(controller),
    );

    router.get(
        '/loans/category/counts',
        // authenticateToken,
        controller.getMostBorrowedCategory.bind(controller),
    );

    router.get(
        '/loans/funding/auto',
        authenticateToken,
        isAdmin,
        controller.getAutoLendData.bind(controller),
    );

    return router;
};

export default Routes;
