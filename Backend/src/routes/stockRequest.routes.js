import express from 'express';
import { body, param, query } from 'express-validator';
import stockRequestController from '../controllers/stockRequest.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Create stock request (Store users)
router.post('/',
  authenticate,
  authorize('store'),
  [
    body('store_id').isInt(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.item_id').isInt(),
    body('items.*.quantity').isDecimal({ min: 0.01 }),
    body('items.*.notes').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  stockRequestController.createStockRequest
);

// Get all stock requests (Admin)
router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'quoted', 'completed']),
    query('store_id').optional().isInt(),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601()
  ],
  validate,
  stockRequestController.getStockRequests
);

// Get my store requests (Store users)
router.get('/my-requests',
  authenticate,
  authorize('store'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'quoted', 'completed'])
  ],
  validate,
  stockRequestController.getMyStoreRequests
);

// Get grouped requests by item (Admin - for quotation creation)
router.get('/grouped-by-item',
  authenticate,
  authorize('admin'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'quoted', 'completed']),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601()
  ],
  validate,
  stockRequestController.getGroupedRequestsByItem
);

// Get stock request by ID
router.get('/:id',
  authenticate,
  [param('id').isInt()],
  validate,
  stockRequestController.getStockRequestById
);

// Update request status (Admin)
router.put('/:id/status',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('status').isIn(['approved', 'rejected', 'quoted', 'completed']),
    body('notes').optional().trim(),
    body('items').optional().isArray(),
    body('items.*.request_item_id').optional().isInt(),
    body('items.*.quantity_approved').optional().isDecimal(),
    body('items.*.status').optional().isIn(['approved', 'rejected'])
  ],
  validate,
  stockRequestController.updateRequestStatus
);

// Delete stock request
router.delete('/:id',
  authenticate,
  authorize('admin', 'store'),
  [param('id').isInt()],
  validate,
  stockRequestController.deleteStockRequest
);

export default router;