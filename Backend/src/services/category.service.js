import { Category, Item } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class CategoryService {
  async getCategories({ page, limit, search, is_active = "true"}) {
    try {
      const offset = (page - 1) * limit;
      const where = {};
      
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }
      
      if (search) {
        where[Op.or] = [
          { category_name: { [Op.like]: `%${search}%` } },
          { category_description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Category.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: offset,
        order: [['category_name', 'ASC']]
      });
      
      return {
        categories: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  async getCategoryById(id) {
    try {
      const category = await Category.findByPk(id);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      logger.error('Get category by ID error:', error);
      throw error;
    }
  }

  async createCategory(categoryData) {
    try {
      const category = await Category.create(categoryData);
      return category;
    } catch (error) {
      logger.error('Create category error:', error);
      throw error;
    }
  }

  async updateCategory(id, updateData) {
    try {
      const category = await Category.findByPk(id);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      await category.update(updateData);
      return category;
    } catch (error) {
      logger.error('Update category error:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const category = await Category.findByPk(id);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      // Check if category is used in items
      const itemCount = await Item.count({ 
        where: { category_id: id }
      });
      // Soft delete if category is used
      await category.update({ is_active: false });      
      return true;
    } catch (error) {
      logger.error('Delete category error:', error);
      throw error;
    }
  }
}

export default new CategoryService();