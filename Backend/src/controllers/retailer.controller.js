import retailerService from '../services/retailer.service.js';
import { UserActivityLog, User } from '../models/index.js';

export const createRetailer = async (req, res, next) => {
  try {
    const retailerData = req.body;
    const retailer = await retailerService.createRetailer(retailerData);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'CREATE_RETAILER',
      activity_description: `Created retailer: ${retailer.retailer_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Retailer created successfully',
      retailer
    });
  } catch (error) {
    next(error);
  }
};

export const setupRetailerOnFirstLogin = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    
    // Check if user is retailer type and first login
    const user = await User.findByPk(userId, {
      include: ['UserType']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.UserType.type_name !== 'retailer') {
      return res.status(403).json({ error: 'Only retailer users can create retailer details' });
    }

    if (!user.first_login) {
      return res.status(400).json({ error: 'Retailer details already configured' });
    }

    const retailerData = {
      ...req.body,
      user_id: userId
    };

    const retailer = await retailerService.createRetailerDetails(retailerData);

    // Update user's first_login to false
    await user.update({ first_login: false });

    await UserActivityLog.create({
      user_id: userId,
      activity_type: 'FIRST_LOGIN_RETAILER_SETUP',
      activity_description: `Retailer setup completed on first login: ${retailer.retailer_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Retailer setup completed successfully',
      retailer,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const getRetailers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const retailers = await retailerService.getRetailers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active
    });
    res.json(retailers);
  } catch (error) {
    next(error);
  }
};

export const getRetailerById = async (req, res, next) => {
  try {
    const retailer = await retailerService.getRetailerById(req.params.id);
    res.json(retailer);
  } catch (error) {
    next(error);
  }
};

export const updateRetailer = async (req, res, next) => {
  try {
    const retailer = await retailerService.updateRetailer(req.params.id, req.body);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_RETAILER',
      activity_description: `Updated retailer: ${retailer.retailer_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Retailer updated successfully',
      retailer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRetailer = async (req, res, next) => {
  try {
    await retailerService.deleteRetailer(req.params.id);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'DELETE_RETAILER',
      activity_description: `Deleted retailer ${req.params.id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Retailer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRetailerQuotations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const quotations = await retailerService.getRetailerQuotations({
      retailer_id: req.params.id,
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    res.json(quotations);
  } catch (error) {
    next(error);
  }
};

export const getRetailerProfile = async (req, res, next) => {
  try {
    const profile = await retailerService.getRetailerProfile(req.user.user_id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const getMyRetailerProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const profile = await retailerService.getRetailerProfile(userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export default {
  createRetailer,
  setupRetailerOnFirstLogin,
  getRetailers,
  getRetailerById,
  updateRetailer,
  deleteRetailer,
  getRetailerQuotations,
  getRetailerProfile,
  getMyRetailerProfile
};