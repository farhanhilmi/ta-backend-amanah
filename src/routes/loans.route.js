import { Router } from 'express';
import { LoansController } from '../api/loans.api.js';
import { authenticateToken, isLender } from '../middleware/authentication.js';

const Routes = () => {
    const router = Router();
    const controller = new LoansController();
    // router.get('/check/:userId/:idCard', controller.loanCheck.bind(controller));
    router.get(
        '/available/recommended',
        authenticateToken,
        isLender,
        controller.getLoanRecommendation.bind(controller),
    );

    router.get(
        '/available',
        authenticateToken,
        controller.getAllAvailableLoans.bind(controller),
    );

    router.get('/available/:loanId', controller.getLoanById.bind(controller));

    return router;
};

export default Routes;
