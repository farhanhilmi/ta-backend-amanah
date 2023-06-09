import { Router } from 'express';

import { UsersController } from '../api/users.api.js';

const Routes = () => {
    const router = Router();

    // * START: USERS or AUTH ROUTES
    const userController = new UsersController();
    router.post('/register', userController.register.bind(userController));
    router.post('/login', userController.login.bind(userController));
    router.post(
        '/login/otp/resend',
        userController.resendOTPLogin.bind(userController),
    );

    router.post(
        '/token/refresh',
        userController.refreshToken.bind(userController),
    );

    router.post(
        '/verification/email/:userId/resend',
        userController.resendVerifyAccount.bind(userController),
    );
    router.post(
        '/verification/email/:userId/:token',
        userController.verifyEmailAccount.bind(userController),
    );

    // FORGET PASSWORD ROUTE
    router.post(
        '/password/reset/request',
        userController.requestForgetPassword.bind(userController),
    );
    router.post(
        '/password/reset/change',
        userController.forgetNewPassword.bind(userController),
    );
    // * END: USERS or AUTH ROUTES

    return router;
};

export default Routes;
