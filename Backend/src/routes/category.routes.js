import express from 'express';
import { body, param, query } from 'express-validator';
import categoryController from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt(),
    query('limit').optional().isInt(),
    query('search').optional().isString(),
    query('is_active').optional().isBoolean()
  ],
  validate,
  categoryController.getCategories
);

router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('category_name').notEmpty(),
    body('category_description').optional().isString(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  categoryController.createCategory
);

router.get('/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  categoryController.getCategoryById
);

router.put('/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('category_name').optional().notEmpty(),
    body('category_description').optional().isString(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  categoryController.updateCategory
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  categoryController.deleteCategory
);

export default router;