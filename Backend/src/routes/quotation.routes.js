// routes/quotation.routes.js (COMPLETE FILE)
import express from 'express';
import { body, param, query } from 'express-validator';
import quotationController from '../controllers/quotation.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// ==================== QUOTATION MANAGEMENT ====================

// Create quotation from stock requests
router.post('/from-stock-requests',
  authenticate,
  authorize('admin'),
  [
    body('request_item_ids')
      .isArray({ min: 1 })
      .withMessage('At least one request item is required'),
    body('request_item_ids.*')
      .isInt()
      .withMessage('Request item IDs must be integers'),
    body('validity_until')
      .isISO8601()
      .withMessage('Valid deadline date is required'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ],
  validate,
  quotationController.createQuotationFromStockRequests
);

// Create regular quotation
router.post('/',
  authenticate,
  authorize('admin', 'store'),
  [
    body('quotation_name')
      .notEmpty()
      .withMessage('Quotation name is required')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Quotation name must be between 3 and 200 characters'),
    body('validity_until')
      .isISO8601()
      .withMessage('Valid deadline date is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.item_id')
      .isInt()
      .withMessage('Valid item ID is required'),
    body('items.*.requested_quantity')
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('Valid quantity is required'),
    body('notes')
      .optional()
      .trim()
  ],
  validate,
  quotationController.createQuotation
);

// Get all quotations
router.get('/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['draft', 'published', 'closed', 'awarded', 'cancelled'])
      .withMessage('Invalid status value'),
    query('search')
      .optional()
      .trim()
  ],
  validate,
  quotationController.getQuotations
);

// Get quotation by ID
router.get('/:id',
  authenticate,
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required')
  ],
  validate,
  quotationController.getQuotationById
);

// Update quotation
router.put('/:id',
  authenticate,
  authorize('admin', 'store'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required'),
    body('quotation_name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }),
    body('validity_until')
      .optional()
      .isISO8601(),
    body('notes')
      .optional()
      .trim()
  ],
  validate,
  quotationController.updateQuotation
);

// ✅ NEW - Update quotation status (close early, cancel, etc.)
router.put('/:id/status',
  authenticate,
  authorize('admin'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['draft', 'published', 'closed', 'awarded', 'cancelled'])
      .withMessage('Invalid status. Must be: draft, published, closed, awarded, or cancelled')
  ],
  validate,
  quotationController.updateQuotationStatus
);

// Delete quotation
router.delete('/:id',
  authenticate,
  authorize('admin'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required')
  ],
  validate,
  quotationController.deleteQuotation
);

// ==================== RETAILER RESPONSES ====================

// Get retailer responses for a quotation
router.get('/:id/responses',
  authenticate,
  authorize('admin', 'store'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required')
  ],
  validate,
  quotationController.getRetailerResponses
);

// Submit retailer response
router.post('/:id/retailer-response',
  authenticate,
  authorize('retailer'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.quotation_item_id')
      .isInt()
      .withMessage('Valid quotation item ID is required'),
    body('items.*.unit_price')
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Valid unit price is required')
      .custom((value) => {
        if (parseFloat(value) <= 0) {
          throw new Error('Unit price must be greater than 0');
        }
        return true;
      }),
    body('items.*.quantity')
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('Valid quantity is required')
      .custom((value) => {
        if (parseFloat(value) <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        return true;
      }),
    body('items.*.notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Item notes must not exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ],
  validate,
  quotationController.submitRetailerQuotation
);

// ==================== AWARD MANAGEMENT ====================

// Get award comparison data
router.get('/:id/award-comparison',
  authenticate,
  authorize('admin'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required')
  ],
  validate,
  quotationController.getAwardComparison
);

// Award quotation
router.post('/:id/award',
  authenticate,
  authorize('admin'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required'),
    body('awards')
      .isArray({ min: 1 })
      .withMessage('At least one award is required'),
    body('awards.*.quotation_item_id')
      .isInt()
      .withMessage('Valid quotation item ID is required'),
    body('awards.*.retailer_quotation_item_id')
      .isInt()
      .withMessage('Valid retailer quotation item ID is required')
  ],
  validate,
  quotationController.awardQuotation
);

// ==================== EXPORTS ====================

// Export quotation
router.get('/:id/export',
  authenticate,
  authorize('admin', 'store'),
  [
    param('id')
      .isInt()
      .withMessage('Valid quotation ID is required'),
    query('format')
      .optional()
      .isIn(['pdf', 'excel'])
      .withMessage('Format must be pdf or excel')
  ],
  validate,
  quotationController.exportQuotation
);

export default router;