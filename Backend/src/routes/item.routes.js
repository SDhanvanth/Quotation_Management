import express from 'express';
import { body, param, query } from 'express-validator';
import itemController from '../controllers/item.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// CREATE - No cache
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('item_name').notEmpty().trim(),
    body('category_id').optional().isInt(),
    body('unit_of_measure').optional().trim(),
    body('price').optional().isDecimal()
  ],
  validate,
  itemController.createItem
);

// GET ALL - Cache enabled
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('category_id').optional().isInt(),
    query('search').optional().trim(),
    query('is_active').optional().isString()
  ],
  validate,
  cacheMiddleware(60), // Cache for 60 seconds
  itemController.getItems
);

// GET CATEGORIES - Cache enabled
router.get('/categories',
  authenticate,
  cacheMiddleware(300), // Cache for 5 minutes
  itemController.getCategories
);

// GET BY ID - Cache enabled
router.get('/:id',
  authenticate,
  [param('id').isInt()],
  validate,
  cacheMiddleware(60), // Cache for 60 seconds
  itemController.getItemById
);

// UPDATE - No cache
router.put('/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt(),
    body('item_name').optional().trim(),
    body('category_id').optional().isInt(),
    body('price').optional().isDecimal(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  itemController.updateItem
);

// DELETE - No cache
router.delete('/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt()],
  validate,
  itemController.deleteItem
);

export default router;