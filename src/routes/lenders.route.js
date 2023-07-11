import { Router } from 'express';
import { LenderController } from '../api/lenders.api.js';
import {
    authenticateToken,
    // isKYCVerified,
    isLender,
} from '../middleware/authentication.js';

const Routes = () => {
    console.log('routes lender');
    const router = Router();
    const controller = new LenderController();
    router.get(
        '/profile',
        authenticateToken,
        isLender,
        controller.getLender.bind(controller),
    );
    router.get(
        '/funding',
        authenticateToken,
        isLender,
        controller.getPortfolio.bind(controller),
    );
    router.get(
        '/profit',
        authenticateToken,
        isLender,
        controller.getProfit.bind(controller),
    );
    router.put(
        '/request/verification',
        authenticateToken,
        isLender,
        controller.verifyKYC.bind(controller),
    );
    router.post(
        '/funding/auto',
        authenticateToken,
        isLender,
        controller.postAutoLend.bind(controller),
    );
    router.get(
        '/funding/auto',
        authenticateToken,
        isLender,
        controller.getAutoLend.bind(controller),
    );
    router.post(
        '/funding',
        authenticateToken,
        isLender,
        // isKYCVerified,
        controller.postFundingLoan.bind(controller),
    );
    return router;
};

export default Routes;
