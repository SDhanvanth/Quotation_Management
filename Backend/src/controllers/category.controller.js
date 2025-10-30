import categoryService from '../services/category.service.js';
import { UserActivityLog } from '../models/index.js';
import logger from '../config/logger.js';

export const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const result = await categoryService.getCategories({
      page,
      limit,
      search,
      is_active
    });
    res.json(result);
  } catch (error) {
    logger.error('Controller - Get categories error:', error);
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json(category);
  } catch (error) {
    logger.error('Controller - Get category by ID error:', error);
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const categoryData = {
      category_name: req.body.category_name,
      category_description: req.body.category_description,
      is_active: req.body.is_active
    };
    
    const category = await categoryService.createCategory(categoryData);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'CREATE_CATEGORY',
      activity_description: `Created category: ${category.category_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    logger.error('Controller - Create category error:', error);
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const updateData = {
      category_name: req.body.category_name,
      category_description: req.body.category_description,
      is_active: req.body.is_active
    };

    const category = await categoryService.updateCategory(req.params.id, updateData);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_CATEGORY',
      activity_description: `Updated category: ${category.category_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    logger.error('Controller - Update category error:', error);
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'DELETE_CATEGORY',
      activity_description: `Deleted category ID: ${req.params.id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Controller - Delete category error:', error);
    next(error);
  }
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};