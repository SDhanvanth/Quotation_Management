import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import storeRoutes from './store.routes.js';
import retailerRoutes from './retailer.routes.js';
import itemRoutes from './item.routes.js';
import quotationRoutes from './quotation.routes.js';
import stockRoutes from './stock.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import categoryRoutes from './category.routes.js';
import stockRequestRoutes from './stockRequest.routes.js';
import reportRoutes from './report.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stores', storeRoutes);
router.use('/retailers', retailerRoutes);
router.use('/items', itemRoutes);
router.use('/quotations', quotationRoutes);
router.use('/stock', stockRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/categories', categoryRoutes);
router.use('/stock-requests', stockRequestRoutes);
router.use('/reports', reportRoutes);

export default router;