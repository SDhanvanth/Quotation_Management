import { User, UserType, Store, RetailerDetails } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class UserService {
  async getUsers({ page = 1, limit = 10, type_id, search }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};
      
      if (type_id) {
        where.type_id = type_id;
      }
      
      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows } = await User.findAndCountAll({
        where,
        include: [{ model: UserType }],
        limit,
        offset,
        order: [
          ['is_active', 'DESC'],
          ['is_approved', 'ASC'],
          ['created_on', 'DESC']
        ]
      });
      
      return {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get users error:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const user = await User.findByPk(id, {
        include: [
          { model: UserType },
          { model: Store },
          { model: RetailerDetails }
        ]
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      const user = await User.findByPk(id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Don't allow updating certain fields
      delete updateData.user_id;
      delete updateData.password;
      
      await user.update(updateData);
      
      return await this.getUserById(id);
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const user = await User.findByPk(id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Soft delete
      await user.update({ is_active: false });
      
      return true;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          { model: UserType },
          { model: Store },
          { model: RetailerDetails }
        ]
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      logger.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, profileData) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update user basic info
      const { email, store, retailer_details, ...userData } = profileData;
      
      if (email) {
        await user.update({ email });
      }
      
      // Update store info if user is a store
      if (store && user.Store) {
        await user.Store.update(store);
      }
      
      // Update retailer info if user is a retailer
      if (retailer_details && user.RetailerDetail) {
        await user.RetailerDetail.update(retailer_details);
      }
      
      return await this.getUserProfile(userId);
    } catch (error) {
      logger.error('Update user profile error:', error);
      throw error;
    }
  }

  async getUnassignedStore() {
    try {
      const store = await Store.findOne({
        where: {
          user_id: null // Store that hasn't been assigned to any user
        }
      });
      return store;
    } catch (error) {
      logger.error('Get unassigned store error:', error);
      throw error;
    }
  }

  async approveUser(userId, adminId, storeData = null) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserType }]
      });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is a store type user and store data is provided
      if (user.UserType?.type_name?.toLowerCase() === 'store' && storeData) {
        // Create a new store for the user
        await Store.create({
          ...storeData,
          user_id: userId
        });
      }
      
      await user.update({
        is_approved: true,
        approved_by: adminId,
        approved_on: new Date()
      });
      
      // Refresh user data with store information
      return await this.getUserById(userId);
    } catch (error) {
      logger.error('Approve user error:', error);
      throw error;
    }
  }

  async rejectUser(userId, reason, adminId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.update({
        is_approved: false,
        approved_by: adminId,
        approved_on: new Date(),
        rejection_reason: reason
      });
      
      return user;
    } catch (error) {
      logger.error('Reject user error:', error);
      throw error;
    }
  }
}

export default new UserService();