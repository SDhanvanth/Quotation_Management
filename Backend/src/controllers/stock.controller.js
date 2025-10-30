import stockService from '../services/stock.service.js';
import { UserActivityLog } from '../models/index.js';
import logger from '../config/logger.js';

export const getStockByStore = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, item_id, low_stock } = req.query;
    const stock = await stockService.getStockByStore({
      store_id: req.params.storeId,
      page: parseInt(page),
      limit: parseInt(limit),
      item_id,
      low_stock: low_stock === 'true'
    });
    res.json(stock);
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { store_id, item_id, quantity, operation } = req.body;
    const stock = await stockService.updateStock({
      store_id,
      item_id,
      quantity,
      operation,
      user_id: req.user.user_id
    });
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_STOCK',
      activity_description: `${operation} ${quantity} units for item ${item_id} in store ${store_id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    next(error);
  }
};

export const transferStock = async (req, res, next) => {
  try {
    const { from_store_id, to_store_id, item_id, quantity } = req.body;
    const result = await stockService.transferStock({
      from_store_id,
      to_store_id,
      item_id,
      quantity,
      user_id: req.user.user_id
    });
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'TRANSFER_STOCK',
      activity_description: `Transferred ${quantity} units of item ${item_id} from store ${from_store_id} to store ${to_store_id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Stock transferred successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

export const getStockReport = async (req, res, next) => {
  try {
    const { store_id, category_id, format = 'json' } = req.query;
    const report = await stockService.getStockReport({
      store_id,
      category_id,
      format
    });
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stock-report.csv');
      res.send(report);
    } else {
      res.json(report);
    }
  } catch (error) {
    next(error);
  }
};

export const setStockLevels = async (req, res, next) => {
  try {
    const { store_id, item_id, min_stock_level, max_stock_level } = req.body;
    const stock = await stockService.setStockLevels({
      store_id,
      item_id,
      min_stock_level,
      max_stock_level
    });
    
    res.json({
      message: 'Stock levels updated successfully',
      stock
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStock = async (req, res, next) => {
  try {
    let { updates } = req.body;

    logger.info('Controller - Raw bulk update data:', req.body);

    // Handle case where updates is an object with numeric keys (from frontend)
    if (!Array.isArray(updates)) {
      updates = Object.values(updates);
    }

    // Transform the data to match expected format
    const transformedUpdates = updates.map(update => ({
      store_id: update.store_id,
      item_id: update.item_id,
      quantity: update.current_stock || update.quantity,
      operation: update.operation || 'set', // Default to 'set' operation
      min_stock_level: update.minimum_stock || update.min_stock_level,
      max_stock_level: update.max_stock_level
    }));

    logger.info('Controller - Transformed bulk update data:', transformedUpdates);

    const result = await stockService.bulkUpdateStock(transformedUpdates, req.user.user_id);

    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'BULK_UPDATE_STOCK',
      activity_description: `Bulk updated ${transformedUpdates.length} stock items`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Stock updated successfully',
      result
    });
  } catch (error) {
    logger.error('Controller - Bulk update stock error:', error);
    next(error);
  }
};

export default {
  getStockByStore,
  updateStock,
  transferStock,
  getStockReport,
  setStockLevels,
  bulkUpdateStock
};