import express from 'express';
import { body, param, query } from 'express-validator';
import stockController from '../controllers/stock.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

router.get('/store/:storeId',
  authenticate,
  authorize('admin', 'store'),
  [
    param('storeId').isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('item_id').optional().isInt(),
    query('low_stock').optional().isBoolean()
  ],
  validate,
  cacheMiddleware(60),
  stockController.getStockByStore
);

router.post('/update',
  authenticate,
  authorize('admin', 'store'),
  [
    body('store_id').isInt(),
    body('item_id').isInt(),
    body('quantity').isDecimal(),
    body('operation').isIn(['add', 'subtract', 'set', 'reserve', 'release'])
  ],
  validate,
  stockController.updateStock
);

// ✅ Updated bulk-update validation to match frontend data
router.post('/bulk-update',
  authenticate,
  authorize('admin', 'store'),
  [
    body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
    body('updates.*.store_id').isInt().withMessage('Store ID must be an integer'),
    body('updates.*.item_id').isInt().withMessage('Item ID must be an integer'),
    body('updates.*.current_stock').isDecimal({ decimal_digits: '0,2' }).withMessage('Current stock must be a valid decimal'),
    body('updates.*.minimum_stock').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Minimum stock must be a valid decimal'),
    body('updates.*.operation').optional().isIn(['add', 'subtract', 'set', 'reserve', 'release']).withMessage('Invalid operation')
  ],
  validate,
  stockController.bulkUpdateStock
);

router.post('/transfer',
  authenticate,
  authorize('admin'),
  [
    body('from_store_id').isInt(),
    body('to_store_id').isInt(),
    body('item_id').isInt(),
    body('quantity').isDecimal()
  ],
  validate,
  stockController.transferStock
);

router.get('/report',
  authenticate,
  authorize('admin', 'store'),
  [
    query('store_id').optional().isInt(),
    query('category_id').optional().isInt(),
    query('format').optional().isIn(['json', 'csv'])
  ],
  validate,
  cacheMiddleware(300),
  stockController.getStockReport
);

router.post('/levels',
  authenticate,
  authorize('admin', 'store'),
  [
    body('store_id').isInt(),
    body('item_id').isInt(),
    body('min_stock_level').optional().isDecimal(),
    body('max_stock_level').optional().isDecimal()
  ],
  validate,
  stockController.setStockLevels
);

export default router;