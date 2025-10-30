import express from 'express';
import { body, param, query } from 'express-validator';
import userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Admin routes
router.post('/:userId/approve',
  authenticate,
  authorize('admin'),
  [param('userId').isInt()],
  validate,
  userController.approveUser
);

router.post('/:userId/reject',
  authenticate,
  authorize('admin'),
  [
    param('userId').isInt(),
    body('reason').notEmpty().withMessage('Rejection reason is required')
  ],
  validate,
  userController.rejectUser
);

router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type_id').optional().isInt(),
    query('search').optional().trim()
  ],
  validate,
  userController.getUsers
);

router.get('/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt()],
  validate,
  userController.getUserById
);

router.put('/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('email').optional().isEmail(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  userController.updateUser
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt()],
  validate,
  userController.deleteUser
);

// Profile routes (all authenticated users)
router.get('/profile/me',
  authenticate,
  userController.getProfile
);

router.put('/profile/me',
  authenticate,
  [
    body('email').optional().isEmail(),
    body('store').optional().isObject(),
    body('retailer_details').optional().isObject()
  ],
  validate,
  userController.updateProfile
);

export default router;