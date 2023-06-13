import { Router } from 'express';
import { LenderController } from '../api/lenders.api.js';
import {
    authenticateToken,
    isKYCVerified,
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
        '/profit',
        authenticateToken,
        isLender,
        controller.getProfit.bind(controller),
    );
    // router.post('/funding/auto', controller.postAutoLend.bind(controller));
    router.post(
        '/funding',
        authenticateToken,
        isLender,
        isKYCVerified,
        controller.postFundingLoan.bind(controller),
    );
    return router;
};

export default Routes;
