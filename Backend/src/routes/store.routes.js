import express from 'express';
import { body, param } from 'express-validator';
import storeController from '../controllers/store.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// First login setup route - Must be BEFORE /:id routes
router.post('/setup',
  authenticate,
  authorize('store'),
  [
    body('store_name').notEmpty().trim().withMessage('Store name is required'),
    body('email_primary').isEmail().normalizeEmail().withMessage('Valid primary email is required'),
    body('phone_primary').optional().trim(),
    body('owner_name').optional().trim(),
    body('gst_number').optional().trim(),
    body('pan_number').optional().trim(),
    body('license_number').optional().trim(),
    body('website').optional().isURL().withMessage('Valid URL required for website'),
    body('address').optional().isObject()
  ],
  validate,
  storeController.setupStoreOnFirstLogin
);

// Get my store profile (for logged-in store user)
router.get('/my-profile',
  authenticate,
  authorize('store'),
  storeController.getMyStoreProfile
);

// Admin routes
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('user_id').isInt().withMessage('Valid user ID is required'),
    body('store_name').notEmpty().trim().withMessage('Store name is required'),
    body('email_primary').isEmail().normalizeEmail().withMessage('Valid primary email is required')
  ],
  validate,
  storeController.createStore
);

router.get('/',
  authenticate,
  authorize('admin'),
  storeController.getStores
);

router.get('/:id',
  authenticate,
  [param('id').isInt()],
  validate,
  storeController.getStoreById
);

router.put('/:id',
  authenticate,
  authorize('admin', 'store'),
  [param('id').isInt()],
  validate,
  storeController.updateStore
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt()],
  validate,
  storeController.deleteStore
);

router.get('/:id/profile',
  authenticate,
  [param('id').isInt()],
  validate,
  storeController.getStoreProfile
);

router.get('/:id/stock',
  authenticate,
  authorize('admin', 'store'),
  [param('id').isInt()],
  validate,
  storeController.getStoreStock
);

export default router;