import { Stock, Store, Item, Category } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import logger from '../config/logger.js';
import { notifyLowStock } from '../hooks/notifications.js';

class StockService {
  async getStockByStore({ store_id, page, limit, item_id, low_stock }) {
    try {
      const offset = (page - 1) * limit;
      const where = { store_id };
      
      if (item_id) {
        where.item_id = item_id;
      }
      
      if (low_stock) {
        where[Op.and] = [
          sequelize.literal('current_stock <= min_stock_level')
        ];
      }
      
      const { count, rows } = await Stock.findAndCountAll({
        where,
        include: [
          {
            model: Item,
            include: [Category]
          }
        ],
        limit,
        offset,
        order: [['last_updated', 'DESC']]
      });
      
      return {
        stocks: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get stock by store error:', error);
      throw error;
    }
  }

  async updateStock({ store_id, item_id, quantity, operation, user_id, min_stock_level, max_stock_level, transaction = null }) {
    const t = transaction || await sequelize.transaction();
    const shouldCommit = !transaction; // Only commit if we created the transaction
    
    try {
      let stock = await Stock.findOne({
        where: { store_id, item_id },
        transaction: t
      });
      
      if (!stock) {
        // Create new stock entry
        stock = await Stock.create({
          store_id,
          item_id,
          current_stock: 0,
          reserved_stock: 0,
          min_stock_level: min_stock_level || 0,
          max_stock_level: max_stock_level || 0,
          created_by: user_id
        }, { transaction: t });
      }
      
      // Update stock based on operation
      switch (operation) {
        case 'add':
          stock.current_stock = parseFloat(stock.current_stock) + parseFloat(quantity);
          break;
        case 'subtract':
          if (stock.current_stock < quantity) {
            throw new Error('Insufficient stock');
          }
          stock.current_stock = parseFloat(stock.current_stock) - parseFloat(quantity);
          break;
        case 'set':
          stock.current_stock = parseFloat(quantity);
          break;
        case 'reserve':
          if (stock.available_stock < quantity) {
            throw new Error('Insufficient available stock');
          }
          stock.reserved_stock = parseFloat(stock.reserved_stock) + parseFloat(quantity);
          break;
        case 'release':
          if (stock.reserved_stock < quantity) {
            throw new Error('Insufficient reserved stock');
          }
          stock.reserved_stock = parseFloat(stock.reserved_stock) - parseFloat(quantity);
          break;
        default:
          throw new Error(`Invalid operation: ${operation}. Valid operations are: add, subtract, set, reserve, release`);
      }
      
      // Update stock levels if provided
      if (min_stock_level !== undefined && min_stock_level !== null) {
        stock.min_stock_level = parseFloat(min_stock_level);
      }
      if (max_stock_level !== undefined && max_stock_level !== null) {
        stock.max_stock_level = parseFloat(max_stock_level);
      }
      
      stock.last_updated = new Date();
      await stock.save({ transaction: t });
      
      if (shouldCommit) {
        await t.commit();
      }
      
      // Check for low stock and send notification (only if we committed)
      if (shouldCommit && stock.current_stock <= stock.min_stock_level && stock.min_stock_level > 0) {
        try {
          const item = await Item.findByPk(item_id);
          const store = await Store.findByPk(store_id);
          await notifyLowStock(stock, item, store);
        } catch (notificationError) {
          logger.error('Low stock notification error:', notificationError);
          // Don't throw here, just log the error
        }
      }
      
      return stock;
    } catch (error) {
      if (shouldCommit) {
        await t.rollback();
      }
      logger.error('Update stock error:', error);
      throw error;
    }
  }

  async transferStock({ from_store_id, to_store_id, item_id, quantity, user_id }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check source stock
      const fromStock = await Stock.findOne({
        where: { store_id: from_store_id, item_id },
        transaction
      });
      
      if (!fromStock || fromStock.available_stock < quantity) {
        throw new Error('Insufficient stock in source store');
      }
      
      // Update source stock
      fromStock.current_stock = parseFloat(fromStock.current_stock) - parseFloat(quantity);
      fromStock.last_updated = new Date();
      await fromStock.save({ transaction });
      
      // Update or create destination stock
      let toStock = await Stock.findOne({
        where: { store_id: to_store_id, item_id },
        transaction
      });
      
      if (!toStock) {
        toStock = await Stock.create({
          store_id: to_store_id,
          item_id,
          current_stock: quantity,
          reserved_stock: 0,
          last_updated: new Date(),
          created_by: user_id
        }, { transaction });
      } else {
        toStock.current_stock = parseFloat(toStock.current_stock) + parseFloat(quantity);
        toStock.last_updated = new Date();
        await toStock.save({ transaction });
      }
      
      await transaction.commit();
      
      return {
        from_stock: fromStock,
        to_stock: toStock
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Transfer stock error:', error);
      throw error;
    }
  }

  async getStockReport({ store_id, category_id, format }) {
    try {
      const where = {};
      const include = [
        {
          model: Item,
          include: [Category],
          where: {}
        }
      ];
      
      if (store_id) {
        where.store_id = store_id;
      }
      
      if (category_id) {
        include[0].where.category_id = category_id;
      }
      
      const stocks = await Stock.findAll({
        where,
        include,
        order: [['store_id', 'ASC'], ['item_id', 'ASC']]
      });
      
      if (format === 'csv') {
        return this.generateCSVReport(stocks);
      }
      
      // Generate summary
      const summary = {
        total_items: stocks.length,
        total_stock_value: 0,
        low_stock_items: stocks.filter(s => s.current_stock <= s.min_stock_level).length,
        out_of_stock_items: stocks.filter(s => s.current_stock === 0).length
      };
      
      return {
        summary,
        stocks
      };
    } catch (error) {
      logger.error('Get stock report error:', error);
      throw error;
    }
  }

  async setStockLevels({ store_id, item_id, min_stock_level, max_stock_level }) {
    try {
      let stock = await Stock.findOne({
        where: { store_id, item_id }
      });
      
      if (!stock) {
        stock = await Stock.create({
          store_id,
          item_id,
          current_stock: 0,
          reserved_stock: 0,
          min_stock_level,
          max_stock_level
        });
      } else {
        await stock.update({
          min_stock_level,
          max_stock_level
        });
      }
      
      return stock;
    } catch (error) {
      logger.error('Set stock levels error:', error);
      throw error;
    }
  }

  async getStockHistory(store_id, item_id, { page = 1, limit = 10 }) {
    try {
      // This would require a separate StockHistory model to track all changes
      // For now, returning empty array
      return {
        history: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    } catch (error) {
      logger.error('Get stock history error:', error);
      throw error;
    }
  }

  async getLowStockItems(store_id) {
    try {
      const stocks = await Stock.findAll({
        where: {
          store_id,
          [Op.and]: [
            sequelize.literal('current_stock <= min_stock_level'),
            { min_stock_level: { [Op.gt]: 0 } }
          ]
        },
        include: [
          {
            model: Item,
            include: [Category]
          }
        ],
        order: [['current_stock', 'ASC']]
      });
      
      return stocks;
    } catch (error) {
      logger.error('Get low stock items error:', error);
      throw error;
    }
  }

    async bulkUpdateStock(updates, user_id) {
    const transaction = await sequelize.transaction();
    
    try {
      const results = [];
      
      logger.info('Service - Processing bulk update:', { count: updates.length, user_id });
      
      for (const update of updates) {
        logger.info('Service - Processing update:', update);
        
        // Validate required fields
        if (!update.store_id || !update.item_id) {
          throw new Error(`Missing required fields: store_id and item_id are required`);
        }
        
        if (update.quantity === undefined || update.quantity === null) {
          throw new Error(`Missing quantity for item ${update.item_id}`);
        }
        
        // Pass user_id and transaction to updateStock
        const stock = await this.updateStock({
          store_id: update.store_id,
          item_id: update.item_id,
          quantity: update.quantity,
          operation: update.operation || 'set',
          min_stock_level: update.min_stock_level,
          max_stock_level: update.max_stock_level,
          user_id,
          transaction // Pass transaction to avoid nested transactions
        });
        results.push(stock);
      }
      
      await transaction.commit();
      logger.info('Service - Bulk update completed successfully:', { count: results.length });
      return results;
    } catch (error) {
      await transaction.rollback();
      logger.error('Bulk update stock error:', error);
      throw error;
    }
  }

  generateCSVReport(stocks) {
    const headers = ['Store ID', 'Item Code', 'Item Name', 'Category', 'Current Stock', 'Reserved Stock', 'Available Stock', 'Min Level', 'Max Level'];
    const rows = stocks.map(stock => [
      stock.store_id,
      stock.Item.item_code,
      stock.Item.item_name,
      stock.Item.Category?.category_name || '',
      stock.current_stock,
      stock.reserved_stock,
      stock.available_stock,
      stock.min_stock_level || '',
      stock.max_stock_level || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }
}

export default new StockService();