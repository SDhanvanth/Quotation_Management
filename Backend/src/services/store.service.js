import { Store, User, Address, Stock } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class StoreService {
  async createStore(storeData) {
    try {
      const { address, ...storeInfo } = storeData;
      
      // Check if store already exists for this user
      if (storeInfo.user_id) {
        const existingStore = await Store.findOne({
          where: { user_id: storeInfo.user_id }
        });

        if (existingStore) {
          throw new Error('Store already exists for this user');
        }
      }
      
      // Generate store code
      storeInfo.store_code = await this.generateStoreCode();
      
      // Create store
      const store = await Store.create(storeInfo);
      
      // Create address if provided
      if (address) {
        await Address.create({
          entity_type: 'store',
          entity_id: store.store_id,
          address_type: 'primary',
          ...address
        });
      }
      
      return await this.getStoreById(store.store_id);
    } catch (error) {
      logger.error('Create store error:', error);
      throw error;
    }
  }

  async getStores({ page = 1, limit = 10, search }) {
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { store_name: { [Op.like]: `%${search}%` } },
          { store_code: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows } = await Store.findAndCountAll({
        where,
        include: [
          { 
            model: User, 
            as: 'storeUser',
            attributes: ['user_id', 'username', 'email']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['store_id', 'DESC']]
      });
      
      return {
        stores: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get stores error:', error);
      throw error;
    }
  }

  async getStoreById(id) {
    try {
      const store = await Store.findByPk(id, {
        include: [
          { model: User, as: 'storeUser' },
          { model: User, as: 'creator' }
        ]
      });
      
      if (!store) {
        throw new Error('Store not found');
      }
      
      // Get addresses
      const addresses = await Address.findAll({
        where: {
          entity_type: 'store',
          entity_id: id
        }
      });
      
      return {
        ...store.toJSON(),
        addresses
      };
    } catch (error) {
      logger.error('Get store by ID error:', error);
      throw error;
    }
  }

  async updateStore(id, updateData) {
    try {
      const store = await Store.findByPk(id);
      
      if (!store) {
        throw new Error('Store not found');
      }
      
      // If user_id is being updated, check if another store exists for that user
      if (updateData.user_id && updateData.user_id !== store.user_id) {
        const existingStore = await Store.findOne({
          where: { 
            user_id: updateData.user_id,
            store_id: { [Op.ne]: id }
          }
        });

        if (existingStore) {
          throw new Error('Store already exists for this user');
        }
      }
      
      await store.update(updateData);
      
      return await this.getStoreById(id);
    } catch (error) {
      logger.error('Update store error:', error);
      throw error;
    }
  }

  async deleteStore(id) {
    try {
      const store = await Store.findByPk(id);
      
      if (!store) {
        throw new Error('Store not found');
      }
      
      // Delete associated addresses
      await Address.destroy({
        where: {
          entity_type: 'store',
          entity_id: id
        }
      });
      
      await store.destroy();
      
      return { message: 'Store deleted successfully' };
    } catch (error) {
      logger.error('Delete store error:', error);
      throw error;
    }
  }

  async generateStoreCode() {
    const lastStore = await Store.findOne({
      order: [['store_code', 'DESC']]
    });
    
    let sequence = 1;
    if (lastStore && lastStore.store_code) {
      const match = lastStore.store_code.match(/STR-(\d+)/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }
    
    return `STR-${String(sequence).padStart(5, '0')}`;
  }

  async getStoreProfile(id) {
    try {
      const store = await Store.findByPk(id, {
        include: [
          { model: User, as: 'storeUser' },
          { model: User, as: 'creator' }
        ]
      });
      
      if (!store) {
        throw new Error('Store not found');
      }

      // Get addresses
      const addresses = await Address.findAll({
        where: {
          entity_type: 'store',
          entity_id: id
        }
      });

      // Get store's stock
      const stock = await Stock.findAll({
        where: { store_id: id }
      });
      
      return {
        ...store.toJSON(),
        addresses,
        stock
      };
    } catch (error) {
      logger.error('Get store profile error:', error);
      throw error;
    }
  }
}

export default new StoreService();