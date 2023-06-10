import authRoutes from './users.route.js';
import borrowerRoutes from './borrowers.route.js';
import lendersRoutes from './lenders.route.js';

const Routes = (app) => {
    app.use('/api/authentication', authRoutes());
    app.use('/api/borrowers', borrowerRoutes());
    app.use('/api/lenders', lendersRoutes());
};

export default Routes;
