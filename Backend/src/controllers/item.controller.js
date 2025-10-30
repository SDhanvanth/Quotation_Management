import itemService from '../services/item.service.js';
import { UserActivityLog } from '../models/index.js';
import logger from '../config/logger.js';
import { clearCache } from '../middleware/cache.js';

export const getItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category_id, search, is_active } = req.query;
    const result = await itemService.getItems({
      page,
      limit,
      category_id,
      search,
      is_active
    });
    res.json(result);
  } catch (error) {
    logger.error('Controller - Get items error:', error);
    next(error);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const itemData = {
      ...req.body,
      created_by: req.user.user_id
    };
    
    const item = await itemService.createItem(itemData);
    
    // Clear all item-related cache
    clearCache('/api/items');
    logger.info('Cache cleared after creating item');
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'CREATE_ITEM',
      activity_description: `Created item: ${item.item_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    logger.error('Controller - Create item error:', error);
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    logger.error('Controller - Get item by ID error:', error);
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const item = await itemService.updateItem(req.params.id, req.body);
    
    // Clear all item-related cache
    clearCache('/api/items');
    logger.info('Cache cleared after updating item');
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_ITEM',
      activity_description: `Updated item: ${item.item_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    logger.error('Controller - Update item error:', error);
    next(error);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    await itemService.deleteItem(req.params.id);
    
    // Clear all item-related cache
    clearCache('/api/items');
    logger.info('Cache cleared after deleting item');
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'DELETE_ITEM',
      activity_description: `Deleted item ${req.params.id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    logger.error('Controller - Delete item error:', error);
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await itemService.getCategories();
    res.json({ categories });
  } catch (error) {
    logger.error('Controller - Get categories error:', error);
    next(error);
  }
};

export default {
  getItems,
  createItem,
  getItemById,
  updateItem,
  deleteItem,
  getCategories
};