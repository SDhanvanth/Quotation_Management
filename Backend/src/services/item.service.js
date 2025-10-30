import { Item, Category, User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class ItemService {
  async getItems({ page, limit, category_id, search, is_active }) {
    try {
      logger.info('ItemService - getItems called with params:', { page, limit, category_id, search, is_active });
      
      const offset = (page - 1) * limit;
      const where = {};
      
      // Only filter by is_active if explicitly provided
      if (is_active !== undefined && is_active !== null && is_active !== '') {
        where.is_active = is_active === 'true' || is_active === true;
        logger.info('ItemService - Filtering by is_active:', where.is_active);
      }
      
      if (category_id) {
        where.category_id = parseInt(category_id);
        logger.info('ItemService - Filtering by category_id:', where.category_id);
      }
      
      if (search) {
        where[Op.or] = [
          { item_name: { [Op.like]: `%${search}%` } },
          { item_code: { [Op.like]: `%${search}%` } }
        ];
        logger.info('ItemService - Searching for:', search);
      }
      
      logger.info('ItemService - Final where clause:', JSON.stringify(where));
      
      const { count, rows } = await Item.findAndCountAll({
        where,
        include: [
          { 
            model: Category,
            attributes: ['category_id', 'category_name']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['item_id', 'DESC']]
      });

      logger.info(`ItemService - Found ${count} total items, returning ${rows.length} items`);
      
      if (rows.length > 0) {
        logger.info('ItemService - First item:', JSON.stringify(rows[0].toJSON()));
      }

      return {
        items: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('ItemService - Get items error:', error);
      logger.error('ItemService - Error stack:', error.stack);
      throw error;
    }
  }

  async createItem(itemData) {
    try {
      logger.info('ItemService - Creating item with data:', itemData);
      
      if (!itemData.item_code) {
        itemData.item_code = await this.generateItemCode();
        logger.info('ItemService - Generated item code:', itemData.item_code);
      }
      
      const item = await Item.create(itemData);
      logger.info('ItemService - Item created with ID:', item.item_id);
      
      return await this.getItemById(item.item_id);
    } catch (error) {
      logger.error('ItemService - Create item error:', error);
      logger.error('ItemService - Error stack:', error.stack);
      throw error;
    }
  }

  async getItemById(id) {
    try {
      const item = await Item.findByPk(id, {
        include: [
          { 
            model: Category,
            attributes: ['category_id', 'category_name']
          }
        ]
      });
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      return item;
    } catch (error) {
      logger.error('ItemService - Get item by ID error:', error);
      throw error;
    }
  }

  async updateItem(id, updateData) {
    try {
      logger.info('ItemService - Updating item:', id, 'with data:', updateData);
      
      const item = await Item.findByPk(id);
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      await item.update(updateData);
      logger.info('ItemService - Item updated successfully');
      
      return await this.getItemById(id);
    } catch (error) {
      logger.error('ItemService - Update item error:', error);
      throw error;
    }
  }

  async deleteItem(id) {
    try {
      logger.info('ItemService - Deleting (deactivating) item:', id);
      
      const item = await Item.findByPk(id);
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      await item.update({ is_active: false });
      logger.info('ItemService - Item deactivated successfully');
      
      return true;
    } catch (error) {
      logger.error('ItemService - Delete item error:', error);
      throw error;
    }
  }

  async generateItemCode() {
    try {
      const lastItem = await Item.findOne({
        order: [['item_code', 'DESC']],
        where: {
          item_code: {
            [Op.like]: 'ITM-%'
          }
        }
      });
      
      let sequence = 1;
      if (lastItem && lastItem.item_code) {
        const match = lastItem.item_code.match(/ITM-(\d+)/);
        if (match) {
          sequence = parseInt(match[1]) + 1;
        }
      }
      
      const newCode = `ITM-${String(sequence).padStart(6, '0')}`;
      logger.info('ItemService - Generated item code:', newCode);
      
      return newCode;
    } catch (error) {
      logger.error('ItemService - Generate item code error:', error);
      throw error;
    }
  }
  
  async getCategories() {
    try {
      const categories = await Category.findAll({
        where: { is_active: true },
        order: [['category_name', 'ASC']]
      });
      return categories;
    } catch (error) {
      logger.error('ItemService - Get categories error:', error);
      throw error;
    }
  }
}

export default new ItemService();