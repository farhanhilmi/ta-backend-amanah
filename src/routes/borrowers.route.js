import { Router } from 'express';
import BorrowerController from '../api/borrowers.api.js';
import { authenticateToken, isBorrower } from '../middleware/authentication.js';

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
        isBorrower,
        controller.postRequestLoan.bind(controller),
    );
    router.get(
        '/loan',
        authenticateToken,
        isBorrower,
        controller.getLoanHistory.bind(controller),
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
