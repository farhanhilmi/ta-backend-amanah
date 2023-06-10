import { Router } from 'express';
import BorrowerController from '../api/borrowers.api.js';
import authenticateToken from '../middleware/authentication.js';

const Routes = () => {
    const router = Router();
    const controller = new BorrowerController();
    // router.get(
    //     '/profile',
    //     authenticateToken,
    //     controller.getProfile.bind(controller),
    // );

    router.post(
        '/loan',
        authenticateToken,
        controller.postRequestLoan.bind(controller),
    );
    router.get(
        '/loan',
        authenticateToken,
        controller.getLoanHistory.bind(controller),
    );
    router.put(
        '/request/verification',
        authenticateToken,
        controller.putVerifyBorrower.bind(controller),
    );

    return router;
};

export default Routes;
