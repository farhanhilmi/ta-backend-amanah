import { Router } from 'express';
import { LoansController } from '../api/loans.api.js';

const Routes = () => {
    const router = Router();
    const controller = new LoansController();
    // router.get('/check/:userId/:idCard', controller.loanCheck.bind(controller));
    router.get('/available', controller.getAllAvailableLoans.bind(controller));
    router.get('/available/:loanId', controller.getLoanById.bind(controller));

    return router;
};

export default Routes;
