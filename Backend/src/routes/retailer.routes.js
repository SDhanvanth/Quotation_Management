import express from 'express';
import { body, param, query } from 'express-validator';
import retailerController from '../controllers/retailer.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// First login setup route - Must be BEFORE /:id routes
router.post('/setup',
  authenticate,
  authorize('retailer'),
  [
    body('retailer_name').notEmpty().trim().withMessage('Retailer name is required'),
    body('owner_name').notEmpty().trim().withMessage('Owner name is required'),
    body('phone_primary').notEmpty().trim().withMessage('Primary phone is required'),
    body('email_primary').isEmail().normalizeEmail().withMessage('Valid primary email is required'),
    body('gst_number').optional().trim(),
    body('pan_number').optional().trim(),
    body('license_number').optional().trim(),
    body('owner_govt_id_type').optional().trim(),
    body('owner_govt_id_number').optional().trim(),
    body('phone_secondary').optional().trim(),
    body('email_secondary').optional().isEmail().normalizeEmail(),
    body('bank_account_number').optional().trim(),
    body('ifsc_code').optional().trim(),
    body('website').optional().isURL().withMessage('Valid URL required for website'),
    body('address').optional().isObject()
  ],
  validate,
  retailerController.setupRetailerOnFirstLogin
);

// Get my retailer profile (for logged-in retailer user)
router.get('/my-profile',
  authenticate,
  authorize('retailer'),
  retailerController.getMyRetailerProfile
);

// Admin routes
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('user.username').notEmpty().trim().withMessage('Username is required'),
    body('user.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('user.password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('retailer_name').notEmpty().trim().withMessage('Retailer name is required'),
    body('owner_name').notEmpty().trim().withMessage('Owner name is required')
  ],
  validate,
  retailerController.createRetailer
);

router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('is_active').optional().isBoolean()
  ],
  validate,
  retailerController.getRetailers
);

router.get('/:id',
  authenticate,
  authorize('admin', 'retailer'),
  [param('id').isInt()],
  validate,
  retailerController.getRetailerById
);

router.put('/:id',
  authenticate,
  authorize('admin', 'retailer'),
  [
    param('id').isInt(),
    body('retailer_name').optional().trim(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  retailerController.updateRetailer
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt()],
  validate,
  retailerController.deleteRetailer
);

router.get('/:id/quotations',
  authenticate,
  authorize('admin', 'retailer'),
  [
    param('id').isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().trim()
  ],
  validate,
  retailerController.getRetailerQuotations
);

export default router;