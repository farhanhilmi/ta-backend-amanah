import authRoutes from './users.route.js';

const Routes = (app) => {
    app.use('/api/authentication', authRoutes());
};

export default Routes;
