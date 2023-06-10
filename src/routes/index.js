import authRoutes from './users.route.js';
import borrowerRoutes from './borrowers.route.js';

const Routes = (app) => {
    app.use('/api/authentication', authRoutes());
    app.use('/api/borrowers', borrowerRoutes());
};

export default Routes;
