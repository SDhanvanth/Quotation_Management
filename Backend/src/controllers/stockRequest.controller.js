import stockRequestService from '../services/stockRequest.service.js';
import { UserActivityLog } from '../models/index.js';
import logger from '../config/logger.js';

export const createStockRequest = async (req, res, next) => {
  try {
    const { store_id, items, notes } = req.body;

    const request = await stockRequestService.createStockRequest({
      store_id,
      items,
      notes
    }, req.user.user_id);

    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'CREATE_STOCK_REQUEST',
      activity_description: `Created stock request for ${items.length} items`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Stock request created successfully',
      request
    });
  } catch (error) {
    logger.error('Controller - Create stock request error:', error);
    next(error);
  }
};

export const getStockRequests = async (req, res, next) => {
  try {
    const { page, limit, status, store_id, from_date, to_date } = req.query;

    const result = await stockRequestService.getStockRequests({
      page,
      limit,
      status,
      store_id,
      from_date,
      to_date
    });

    res.json(result);
  } catch (error) {
    logger.error('Controller - Get stock requests error:', error);
    next(error);
  }
};

export const getStockRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await stockRequestService.getStockRequestById(id);

    res.json(request);
  } catch (error) {
    logger.error('Controller - Get stock request by ID error:', error);
    next(error);
  }
};

export const getGroupedRequestsByItem = async (req, res, next) => {
  try {
    const { status, from_date, to_date } = req.query;

    const groupedItems = await stockRequestService.getGroupedRequestsByItem({
      status,
      from_date,
      to_date
    });

    res.json({
      message: 'Grouped items retrieved successfully',
      items: groupedItems,
      total_items: groupedItems.length
    });
  } catch (error) {
    logger.error('Controller - Get grouped requests error:', error);
    next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, items } = req.body;

    const request = await stockRequestService.updateRequestStatus(
      id,
      status,
      req.user.user_id,
      { notes, items }
    );

    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_STOCK_REQUEST_STATUS',
      activity_description: `Updated stock request ${id} status to ${status}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: `Stock request ${status} successfully`,
      request
    });
  } catch (error) {
    logger.error('Controller - Update request status error:', error);
    next(error);
  }
};

export const getMyStoreRequests = async (req, res, next) => {
  try {
    const storeId = req.user.Store?.store_id;

    if (!storeId) {
      return res.status(404).json({ error: 'Store not found for this user' });
    }

    const { page, limit, status } = req.query;

    const result = await stockRequestService.getStoreRequests(storeId, {
      page,
      limit,
      status
    });

    res.json(result);
  } catch (error) {
    logger.error('Controller - Get my store requests error:', error);
    next(error);
  }
};

export const deleteStockRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    await stockRequestService.deleteStockRequest(id);

    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'DELETE_STOCK_REQUEST',
      activity_description: `Deleted stock request ${id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Stock request deleted successfully' });
  } catch (error) {
    logger.error('Controller - Delete stock request error:', error);
    next(error);
  }
};

export default {
  createStockRequest,
  getStockRequests,
  getStockRequestById,
  getGroupedRequestsByItem,
  updateRequestStatus,
  getMyStoreRequests,
  deleteStockRequest
};