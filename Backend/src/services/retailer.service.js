import { 
  RetailerDetails, 
  User, 
  UserType, 
  Address,
  RetailerQuotation,
  Quotation 
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import logger from '../config/logger.js';
import authService from './auth.service.js';

class RetailerService {
  async createRetailer(retailerData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { user, address, ...retailerInfo } = retailerData;
      
      // Get retailer user type
      const retailerType = await UserType.findOne({ 
        where: { type_name: 'retailer' } 
      });
      
      // Create user account
      const newUser = await User.create({
        ...user,
        type_id: retailerType.type_id
      }, { transaction });
      
      // Generate retailer code
      retailerInfo.retailer_code = await this.generateRetailerCode();
      
      // Create retailer details
      const retailer = await RetailerDetails.create({
        ...retailerInfo,
        user_id: newUser.user_id
      }, { transaction });
      
      // Create address if provided
      if (address) {
        await Address.create({
          entity_type: 'retailer',
          entity_id: retailer.retailer_id,
          address_type: 'primary',
          ...address
        }, { transaction });
      }
      
      await transaction.commit();
      
      return await this.getRetailerById(retailer.retailer_id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Create retailer error:', error);
      throw error;
    }
  }

  // NEW METHOD: For first login retailer setup
  async createRetailerDetails(retailerData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { address, ...retailerInfo } = retailerData;
      
      // Check if retailer details already exist
      const existingRetailer = await RetailerDetails.findOne({
        where: { user_id: retailerInfo.user_id }
      });

      if (existingRetailer) {
        throw new Error('Retailer details already exist for this user');
      }
      
      // Generate retailer code
      retailerInfo.retailer_code = await this.generateRetailerCode();
      
      // Create retailer details
      const retailer = await RetailerDetails.create(retailerInfo, { transaction });
      
      // Create address if provided
      if (address) {
        await Address.create({
          entity_type: 'retailer',
          entity_id: retailer.retailer_id,
          address_type: 'primary',
          ...address
        }, { transaction });
      }
      
      await transaction.commit();
      
      return await this.getRetailerById(retailer.retailer_id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Create retailer details error:', error);
      throw error;
    }
  }

  async getRetailers({ page, limit, search, is_active }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};
      
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }
      
      if (search) {
        where[Op.or] = [
          { retailer_name: { [Op.like]: `%${search}%` } },
          { retailer_code: { [Op.like]: `%${search}%` } },
          { owner_name: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows } = await RetailerDetails.findAndCountAll({
        where,
        include: [{ model: User }],
        limit,
        offset,
        order: [['created_on', 'DESC']]
      });
      
      return {
        retailers: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get retailers error:', error);
      throw error;
    }
  }

  async getRetailerById(id) {
    try {
      const retailer = await RetailerDetails.findByPk(id, {
        include: [{ model: User }]
      });
      
      if (!retailer) {
        throw new Error('Retailer not found');
      }
      
      // Get addresses
      const addresses = await Address.findAll({
        where: {
          entity_type: 'retailer',
          entity_id: id
        }
      });
      
      return {
        ...retailer.toJSON(),
        addresses
      };
    } catch (error) {
      logger.error('Get retailer by ID error:', error);
      throw error;
    }
  }

  async updateRetailer(id, updateData) {
    try {
      const retailer = await RetailerDetails.findByPk(id);
      
      if (!retailer) {
        throw new Error('Retailer not found');
      }
      
      await retailer.update(updateData);
      
      return await this.getRetailerById(id);
    } catch (error) {
      logger.error('Update retailer error:', error);
      throw error;
    }
  }

  async getRetailerQuotations({ retailer_id, page, limit, status }) {
    try {
      const offset = (page - 1) * limit;
      const where = { retailer_id };
      
      if (status) {
        where.status = status;
      }
      
      const { count, rows } = await RetailerQuotation.findAndCountAll({
        where,
        include: [
          {
            model: Quotation,
            include: ['QuotationStatus', 'QuotationItems']
          }
        ],
        limit,
        offset,
        order: [['created_on', 'DESC']]
      });
      
      return {
        quotations: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get retailer quotations error:', error);
      throw error;
    }
  }

  async getRetailerProfile(userId) {
    try {
      const retailer = await RetailerDetails.findOne({
        where: { user_id: userId },
        include: [{ model: User }]
      });
      
      if (!retailer) {
        throw new Error('Retailer profile not found');
      }
      
      const addresses = await Address.findAll({
        where: {
          entity_type: 'retailer',
          entity_id: retailer.retailer_id
        }
      });
      
      return {
        ...retailer.toJSON(),
        addresses
      };
    } catch (error) {
      logger.error('Get retailer profile error:', error);
      throw error;
    }
  }

  async generateRetailerCode() {
    const lastRetailer = await RetailerDetails.findOne({
      order: [['retailer_code', 'DESC']]
    });
    
    let sequence = 1;
    if (lastRetailer && lastRetailer.retailer_code) {
      const match = lastRetailer.retailer_code.match(/RET-(\d+)/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }
    
    return `RET-${String(sequence).padStart(5, '0')}`;
  }
}

export default new RetailerService();