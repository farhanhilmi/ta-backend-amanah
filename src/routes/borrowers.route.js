import { Router } from 'express';
import BorrowerController from '../api/borrowers.api.js';
import {
    authenticateToken,
    isBorrower,
    // isKYCVerified,
} from '../middleware/authentication.js';

const Routes = () => {
    const router = Router();
    const controller = new BorrowerController();
    router.get(
        '/profile',
        authenticateToken,
        isBorrower,
        controller.getProfile.bind(controller),
    );

    router.post(
        '/loan',
        authenticateToken,
        isBorrower,
        // isKYCVerified,
        controller.postRequestLoan.bind(controller),
    );
    router.get(
        '/loan',
        authenticateToken,
        isBorrower,
        controller.getLoanHistory.bind(controller),
    );

    router.get(
        '/payment/schedule',
        authenticateToken,
        isBorrower,
        controller.getPaymentSchedule.bind(controller),
    );

    router.get(
        '/loan/disbursement',
        authenticateToken,
        isBorrower,
        controller.getFundDisbursement.bind(controller),
    );

    router.post(
        '/loan/disbursement',
        authenticateToken,
        isBorrower,
        controller.postFundDisbursement.bind(controller),
    );

    router.post(
        '/loan/repayment',
        authenticateToken,
        isBorrower,
        controller.postRepayment.bind(controller),
    );

    router.put(
        '/request/verification',
        authenticateToken,
        isBorrower,
        controller.putVerifyBorrower.bind(controller),
    );

    return router;
};

export default Routes;
