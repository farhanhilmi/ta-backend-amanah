import authRoutes from './users.route.js';
import borrowerRoutes from './borrowers.route.js';
import lendersRoutes from './lenders.route.js';
import loansRoutes from './loans.route.js';
import balanceRoutes from './balance.route.js';
// import transactionIn from '../services/flipWebhook/transactionIn.js';
import {
    inquiryBankAccount,
    transactionOut,
    transactionIn,
} from '../services/flipWebhook/index.js';

const Routes = (app) => {
    app.use('/api/authentication', authRoutes());
    app.use('/api/borrowers', borrowerRoutes());
    app.use('/api/lenders', lendersRoutes());
    app.use('/api/loans', loansRoutes());
    app.use('/api/balance', balanceRoutes());

    // webhook
    app.post('/flip/transaction/in', transactionIn);
    app.post('/flip/transaction/out', transactionOut);
    app.post('/flip/inquiry/bank', inquiryBankAccount);
};

export default Routes;
