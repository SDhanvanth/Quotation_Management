// services/stockRequest.service.js
import { StockRequest, StockRequestItem, Store, Item, User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import sequelize from '../config/database.js';

class StockRequestService {
  // Create new stock request
  async createStockRequest(data, userId) {
    const transaction = await sequelize.transaction();

    try {
      const { store_id, items, notes } = data;

      logger.info('Creating stock request:', { store_id, itemCount: items.length, userId });

      // Create main request
      const stockRequest = await StockRequest.create({
        store_id,
        notes,
        created_by: userId,
        status: 'pending',
        request_date: new Date()
      }, { transaction });

      logger.info('Stock request created:', stockRequest.request_id);

      // Create request items
      const requestItems = items.map(item => ({
        request_id: stockRequest.request_id,
        item_id: item.item_id,
        quantity_requested: item.quantity,
        notes: item.notes || null,
        status: 'pending'
      }));

      await StockRequestItem.bulkCreate(requestItems, { transaction });

      logger.info('Request items created:', requestItems.length);

      await transaction.commit();

      return await this.getStockRequestById(stockRequest.request_id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Create stock request error:', error);
      throw error;
    }
  }

  // Get all stock requests with filters
  async getStockRequests(filters = {}) {
    try {
      const { page = 1, limit = 10, status, store_id, from_date, to_date } = filters;
      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (store_id) where.store_id = store_id;
      if (from_date || to_date) {
        where.request_date = {};
        if (from_date) where.request_date[Op.gte] = from_date;
        if (to_date) where.request_date[Op.lte] = to_date;
      }

      logger.info('Getting stock requests with filters:', filters);

      const { count, rows } = await StockRequest.findAndCountAll({
        where,
        include: [
          { 
            model: Store,
            attributes: ['store_id', 'store_name', 'store_code']
          },
          {
            model: User,
            as: 'requestCreator', // ✅ Fixed alias
            attributes: ['user_id', 'username']
          },
          {
            model: StockRequestItem,
            include: [{
              model: Item,
              attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price']
            }]
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_on', 'DESC']]
      });

      logger.info(`Found ${count} stock requests`);

      return {
        requests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get stock requests error:', error);
      throw error;
    }
  }

  // Get stock request by ID
  async getStockRequestById(requestId) {
    try {
      const request = await StockRequest.findByPk(requestId, {
        include: [
          { 
            model: Store,
            attributes: ['store_id', 'store_name', 'store_code', 'owner_name']
          },
          {
            model: User,
            as: 'requestCreator', // ✅ Fixed alias
            attributes: ['user_id', 'username']
          },
          {
            model: StockRequestItem,
            include: [{
              model: Item,
              attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price']
            }]
          }
        ]
      });

      if (!request) {
        throw new Error('Stock request not found');
      }

      return request;
    } catch (error) {
      logger.error('Get stock request by ID error:', error);
      throw error;
    }
  }

  // Get grouped requests by item (for admin quotation creation)
  async getGroupedRequestsByItem(filters = {}) {
    try {
      const { status = 'pending', from_date, to_date } = filters;
      const where = { status };

      if (from_date || to_date) {
        where.request_date = {};
        if (from_date) where.request_date[Op.gte] = from_date;
        if (to_date) where.request_date[Op.lte] = to_date;
      }

      logger.info('Getting grouped requests by item:', filters);

      const requests = await StockRequest.findAll({
        where,
        include: [{
          model: StockRequestItem,
          where: { status: 'pending' },
          required: true,
          include: [{
            model: Item,
            attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price']
          }]
        }, {
          model: Store,
          attributes: ['store_id', 'store_name', 'store_code']
        }]
      });

      // Group by item_id
      const groupedItems = {};

      requests.forEach(request => {
        request.StockRequestItems.forEach(requestItem => {
          const itemId = requestItem.item_id;

          if (!groupedItems[itemId]) {
            groupedItems[itemId] = {
              item_id: requestItem.Item.item_id,
              item_code: requestItem.Item.item_code,
              item_name: requestItem.Item.item_name,
              unit_of_measure: requestItem.Item.unit_of_measure,
              price: parseFloat(requestItem.Item.price || 0),
              total_quantity: 0,
              total_stores: 0,
              stores: [],
              request_ids: []
            };
          }

          groupedItems[itemId].total_quantity += parseFloat(requestItem.quantity_requested);
          groupedItems[itemId].stores.push({
            store_id: request.Store.store_id,
            store_name: request.Store.store_name,
            store_code: request.Store.store_code,
            quantity: parseFloat(requestItem.quantity_requested),
            request_id: request.request_id,
            request_item_id: requestItem.request_item_id,
            notes: requestItem.notes,
            request_date: request.request_date
          });
          
          if (!groupedItems[itemId].request_ids.includes(request.request_id)) {
            groupedItems[itemId].request_ids.push(request.request_id);
          }
        });
      });

      // Convert to array and add store count
      const result = Object.values(groupedItems).map(item => ({
        ...item,
        total_stores: item.stores.length
      }));

      logger.info(`Grouped into ${result.length} unique items`);

      return result;
    } catch (error) {
      logger.error('Get grouped requests by item error:', error);
      throw error;
    }
  }

  // Approve/Reject stock request
  async updateRequestStatus(requestId, status, userId, approvalData = {}) {
    const transaction = await sequelize.transaction();

    try {
      const request = await StockRequest.findByPk(requestId, {
        include: [{ model: StockRequestItem }]
      });

      if (!request) {
        throw new Error('Stock request not found');
      }

      logger.info(`Updating request ${requestId} status to ${status}`);

      await request.update({
        status,
        approved_by: userId,
        approval_date: new Date(),
        approval_notes: approvalData.notes || null
      }, { transaction });

      // Update individual items if provided
      if (approvalData.items && Array.isArray(approvalData.items)) {
        for (const itemUpdate of approvalData.items) {
          await StockRequestItem.update({
            quantity_approved: itemUpdate.quantity_approved || 0,
            status: itemUpdate.status || status
          }, {
            where: { request_item_id: itemUpdate.request_item_id },
            transaction
          });
        }
      } else {
        // Update all items with same status
        await StockRequestItem.update({
          status: status === 'approved' ? 'approved' : 'rejected'
        }, {
          where: { request_id: requestId },
          transaction
        });
      }

      await transaction.commit();

      logger.info(`Request ${requestId} updated successfully`);

      return await this.getStockRequestById(requestId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Update request status error:', error);
      throw error;
    }
  }

  // Get requests by store
  async getStoreRequests(storeId, filters = {}) {
    try {
      const { page = 1, limit = 10, status } = filters;
      const offset = (page - 1) * limit;
      const where = { store_id: storeId };

      if (status) where.status = status;

      logger.info('Getting requests for store:', storeId);

      const { count, rows } = await StockRequest.findAndCountAll({
        where,
        include: [{
          model: StockRequestItem,
          include: [{
            model: Item,
            attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price']
          }]
        }],
        limit: parseInt(limit),
        offset,
        order: [['created_on', 'DESC']]
      });

      return {
        requests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get store requests error:', error);
      throw error;
    }
  }

  // Delete stock request
  async deleteStockRequest(requestId) {
    const transaction = await sequelize.transaction();

    try {
      const request = await StockRequest.findByPk(requestId);

      if (!request) {
        throw new Error('Stock request not found');
      }

      // Check if request can be deleted (only pending requests)
      if (request.status !== 'pending') {
        throw new Error('Only pending requests can be deleted');
      }

      logger.info('Deleting stock request:', requestId);

      // Delete request items first
      await StockRequestItem.destroy({
        where: { request_id: requestId },
        transaction
      });

      // Delete main request
      await request.destroy({ transaction });

      await transaction.commit();
      
      logger.info('Stock request deleted successfully');
      
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Delete stock request error:', error);
      throw error;
    }
  }
}

export default new StockRequestService();