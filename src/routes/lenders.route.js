import { Router } from 'express';
import { LenderController } from '../api/lenders.api.js';
import { authenticateToken, isLender } from '../middleware/authentication.js';

const Routes = () => {
    try {
        console.log('routes lender');
        const router = Router();
        const controller = new LenderController();
        router.get(
            '/profile',
            authenticateToken,
            isLender,
            controller.getLender.bind(controller),
        );
        // router.post('/funding/auto', controller.postAutoLend.bind(controller));
        // router.post(
        //     '/funding',
        //     authenticateToken,
        //     isLender,
        //     controller.postFundingLoan.bind(controller),
        // );
        return router;
    } catch (error) {
        throw error;
    }
};

export default Routes;
