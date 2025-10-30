import express from 'express';
import { body, param, query } from 'express-validator';
import adminController from '../controllers/admin.controller.js';
import storeController from '../controllers/store.controller.js';
import retailerController from '../controllers/retailer.controller.js';
import itemController from '../controllers/item.controller.js';
import categoryController from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Dashboard Overview
router.get('/dashboard-stats',
  authenticate,
  authorize('admin'),
  adminController.getDashboardStats
);

// Existing routes
router.get('/pending-approvals',
  authenticate,
  authorize('admin'),
  adminController.getPendingApprovals
);

router.post('/approve-user/:userId',
  authenticate,
  authorize('admin'),
  [
    param('userId').isInt(),
    body('storeId').optional().isInt()
  ],
  validate,
  adminController.approveUser
);

router.post('/reject-user/:userId',
  authenticate,
  authorize('admin'),
  [
    param('userId').isInt(),
    body('reason').notEmpty()
  ],
  validate,
  adminController.rejectUser
);

router.post('/assign-store',
  authenticate,
  authorize('admin'),
  [
    body('userId').isInt(),
    body('storeId').isInt()
  ],
  validate,
  adminController.assignStore
);

router.get('/unassigned-stores',
  authenticate,
  authorize('admin'),
  adminController.getUnassignedStores
);

// Activity Logs
router.get('/activity-logs',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt(),
    query('limit').optional().isInt(),
    query('user_id').optional().isInt(),
    query('activity_type').optional().isString(),
    query('date_from').optional().isDate(),
    query('date_to').optional().isDate()
  ],
  validate,
  adminController.getActivityLogs
);

// Store Management Routes
router.get('/stores',
  authenticate,
  authorize('admin'),
  storeController.getStores
);

router.get('/stores/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  storeController.getStoreById
);

router.get('/stores/:id/stock',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  storeController.getStoreStock
);

router.put('/stores/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('store_name').optional().notEmpty(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  storeController.updateStore
);

// Retailer Management Routes
router.get('/retailers',
  authenticate,
  authorize('admin'),
  retailerController.getRetailers
);

router.get('/retailers/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  retailerController.getRetailerById
);

router.get('/retailers/:id/quotations',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  retailerController.getRetailerQuotations
);

router.put('/retailers/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  retailerController.updateRetailer
);

// Item Management Routes
router.get('/items',
  authenticate,
  authorize('admin'),
  itemController.getItems
);

router.post('/items',
  authenticate,
  authorize('admin'),
  [
    body('item_name').notEmpty(),
    body('category_id').isInt(),
    body('unit_of_measure').notEmpty()
  ],
  validate,
  itemController.createItem
);

router.get('/items/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  itemController.getItemById
);

router.put('/items/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('item_name').optional().notEmpty(),
    body('category_id').optional().isInt()
  ],
  validate,
  itemController.updateItem
);

// Category Management Routes
router.get('/categories',
  authenticate,
  authorize('admin'),
  categoryController.getCategories
);

router.post('/categories',
  authenticate,
  authorize('admin'),
  [
    body('category_name').notEmpty(),
    body('category_description').optional().isString(),
    body('parent_category_id').optional().isInt()
  ],
  validate,
  categoryController.createCategory
);

router.get('/categories/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  categoryController.getCategoryById
);

router.put('/categories/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('category_name').optional().notEmpty(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  categoryController.updateCategory
);

export default router;