import storeService from '../services/store.service.js';
import { UserActivityLog, User } from '../models/index.js';

export const createStore = async (req, res, next) => {
  try {
    const storeData = {
      ...req.body,
      created_by: req.user.user_id
    };
    const store = await storeService.createStore(storeData);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'CREATE_STORE',
      activity_description: `Created store: ${store.store_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    next(error);
  }
};

export const setupStoreOnFirstLogin = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    
    // Check if user is store type and first login
    const user = await User.findByPk(userId, {
      include: ['UserType']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.UserType.type_name !== 'store') {
      return res.status(403).json({ error: 'Only store users can create store details' });
    }

    if (!user.first_login) {
      return res.status(400).json({ error: 'Store details already configured' });
    }

    const storeData = {
      ...req.body,
      user_id: userId,
      created_by: userId
    };

    const store = await storeService.createStore(storeData);

    // Update user's first_login to false
    await user.update({ first_login: false });

    await UserActivityLog.create({
      user_id: userId,
      activity_type: 'FIRST_LOGIN_STORE_SETUP',
      activity_description: `Store setup completed on first login: ${store.store_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Store setup completed successfully',
      store,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const getStores = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search } = req.query;

    const result = await storeService.getStores({
      page,
      limit,
      search
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (req, res, next) => {
  try {
    const store = await storeService.getStoreById(req.params.id);
    res.json(store);
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_STORE',
      activity_description: `Updated store: ${store.store_name}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Store updated successfully',
      store
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req, res, next) => {
  try {
    await storeService.deleteStore(req.params.id);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'DELETE_STORE',
      activity_description: `Deleted store ${req.params.id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getStoreProfile = async (req, res, next) => {
  try {
    const profile = await storeService.getStoreProfile(req.params.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const getMyStoreProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const user = await User.findByPk(userId, {
      include: ['Store']
    });

    if (!user.Store) {
      return res.status(404).json({ error: 'Store not found for this user' });
    }

    const profile = await storeService.getStoreProfile(user.Store.store_id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const getStoreStock = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, low_stock } = req.query;
    const stock = await storeService.getStoreStock(req.params.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      low_stock: low_stock === 'true'
    });
    res.json(stock);
  } catch (error) {
    next(error);
  }
};

export default {
  createStore,
  setupStoreOnFirstLogin,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
  getStoreProfile,
  getMyStoreProfile,
  getStoreStock
};