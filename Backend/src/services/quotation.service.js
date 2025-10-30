// services/quotation.service.js - COMPLETE CORRECTED VERSION
import { 
  Quotation, 
  QuotationItem, 
  Item, 
  Store, 
  RetailerQuotation,
  RetailerQuotationItem,
  QuotationStatus,
  User,
  RetailerDetails,
  StockRequest,
  StockRequestItem
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import logger from '../config/logger.js';
import { notifyQuotationCreated, notifyQuotationAwarded } from '../hooks/notifications.js';

class QuotationService {
  
  // ✅ Create quotation from stock requests
  async createQuotationFromStockRequests(quotationData, requestItemIds) {
    let transaction;
    
    try {
      transaction = await sequelize.transaction();
      
      const { validity_until, notes, created_by } = quotationData;

      logger.info('Creating quotation from stock requests:', { 
        requestItemIds, 
        created_by 
      });

      // Check if items exist
      const requestItems = await StockRequestItem.findAll({
        where: {
          request_item_id: requestItemIds
        },
        include: [
          { 
            model: Item,
            attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price'],
            required: true
          },
          {
            model: StockRequest,
            attributes: ['request_id', 'store_id', 'notes'],
            required: true
          }
        ],
        transaction
      });

      if (requestItems.length === 0) {
        throw new Error('No stock request items found with the provided IDs');
      }

      logger.info(`Found ${requestItems.length} stock request items`);

      // Check if any items are already quoted
      const alreadyQuotedItems = requestItems.filter(item => item.is_quoted === true);
      if (alreadyQuotedItems.length > 0) {
        const quotedIds = alreadyQuotedItems.map(item => item.request_item_id);
        throw new Error(`Some items are already quoted: ${quotedIds.join(', ')}. Please refresh and try again.`);
      }

      // Group items by item_id
      const itemsMap = new Map();
      const requestIds = new Set();
      let primaryStockRequestId = null;

      requestItems.forEach(reqItem => {
        if (reqItem.StockRequest) {
          requestIds.add(reqItem.StockRequest.request_id);
          if (!primaryStockRequestId) {
            primaryStockRequestId = reqItem.StockRequest.request_id;
          }
        }
        
        const itemId = reqItem.item_id;
        if (!itemsMap.has(itemId)) {
          itemsMap.set(itemId, {
            item_id: itemId,
            item_name: reqItem.Item?.item_name || 'Unknown',
            item_code: reqItem.Item?.item_code || 'Unknown',
            unit_of_measure: reqItem.Item?.unit_of_measure || 'Unit',
            total_quantity: 0,
            request_item_ids: []
          });
        }
        
        const item = itemsMap.get(itemId);
        item.total_quantity += parseFloat(reqItem.quantity_requested || 0);
        item.request_item_ids.push(reqItem.request_item_id);
      });

      if (itemsMap.size === 0) {
        throw new Error('No valid items found to create quotation');
      }

      logger.info(`Grouped into ${itemsMap.size} unique items`);

      // Generate quotation number
      const quotation_number = await this.generateQuotationNumber();

      // Get published status
      const publishedStatus = await QuotationStatus.findOne({
        where: { status_name: 'published' },
        transaction
      });

      if (!publishedStatus) {
        throw new Error('Published status not found. Please run seeders.');
      }

      // Create quotation
      const quotationCreateData = {
        quotation_number,
        quotation_name: `Stock Request Quotation - ${quotation_number}`,
        quotation_type: 'stock_request',
        status_id: publishedStatus.status_id,
        created_by,
        validity_from: new Date(),
        validity_until,
        notes: notes || 'Created from stock requests',
        is_active: true
      };

      if (primaryStockRequestId) {
        quotationCreateData.stock_request_id = primaryStockRequestId;
      }

      const quotation = await Quotation.create(quotationCreateData, { transaction });

      logger.info('Quotation created with ID:', quotation.quotation_id);

      // Create quotation items
      const quotationItems = Array.from(itemsMap.values()).map(item => ({
        quotation_id: quotation.quotation_id,
        item_id: item.item_id,
        requested_quantity: item.total_quantity,
        unit_of_measure: item.unit_of_measure,
        specifications: `Aggregated from ${item.request_item_ids.length} requests`,
        is_active: true
      }));

      await QuotationItem.bulkCreate(quotationItems, { transaction });

      logger.info(`Created ${quotationItems.length} quotation items`);

      // Update stock request items
      await StockRequestItem.update(
        { 
          is_quoted: true,
          status: 'approved'
        },
        {
          where: { request_item_id: requestItemIds },
          transaction
        }
      );

      // Update stock requests status
      if (requestIds.size > 0) {
        await StockRequest.update(
          { status: 'quoted' },
          {
            where: { request_id: Array.from(requestIds) },
            transaction
          }
        );
      }

      await transaction.commit();
      logger.info('Transaction committed successfully');

      // Fetch the created quotation with proper structure
      const createdQuotation = await this.getQuotationById(quotation.quotation_id);

      // Send notifications
      try {
        await notifyQuotationCreated(createdQuotation);
        logger.info('Notifications sent successfully');
      } catch (notifyError) {
        logger.error('Failed to send notifications (non-critical):', notifyError);
      }

      return createdQuotation;

    } catch (error) {
      if (transaction && !transaction.finished) {
        try {
          await transaction.rollback();
          logger.info('Transaction rolled back due to error');
        } catch (rollbackError) {
          logger.error('Rollback error:', rollbackError);
        }
      }
      
      logger.error('Create quotation from stock requests error:', error.message);
      throw error;
    }
  }

  // ✅ Create standard quotation
  async createQuotation(quotationData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { items, ...quotationInfo } = quotationData;
      
      quotationInfo.quotation_number = await this.generateQuotationNumber();
      
      if (!quotationInfo.stock_request_id) {
        quotationInfo.stock_request_id = null;
      }
      
      const quotation = await Quotation.create(quotationInfo, { transaction });
      
      if (items && items.length > 0) {
        const quotationItems = items.map(item => ({
          ...item,
          quotation_id: quotation.quotation_id
        }));
        await QuotationItem.bulkCreate(quotationItems, { transaction });
      }
      
      await transaction.commit();
      
      const createdQuotation = await this.getQuotationById(quotation.quotation_id);
      
      if (createdQuotation.status_id === 2) {
        await notifyQuotationCreated(createdQuotation);
      }
      
      return createdQuotation;
    } catch (error) {
      await transaction.rollback();
      logger.error('Create quotation error:', error);
      throw error;
    }
  }

  // ✅ FIXED - Get quotations with proper data structure
  async getQuotations({ page = 1, limit = 10, status, type, userType, userId, search }) {
    try {
      const offset = (page - 1) * limit;
      const where = { is_active: true };
      
      if (status) where.status_id = status;
      if (type) where.quotation_type = type;
      
      if (search) {
        where[Op.or] = [
          { quotation_number: { [Op.like]: `%${search}%` } },
          { quotation_name: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (userType === 'store') {
        const store = await Store.findOne({ where: { user_id: userId } });
        if (store) {
          where.created_by = userId;
        }
      }
      
      // Get basic quotation data
      const { count, rows } = await Quotation.findAndCountAll({
        where,
        include: [
          { 
            model: QuotationStatus,
            attributes: ['status_id', 'status_name'],
            required: false
          },
          { 
            model: User, 
            as: 'quotationCreator', 
            attributes: ['user_id', 'username', 'email'],
            required: false
          }
        ],
        limit,
        offset,
        order: [['created_on', 'DESC']],
        distinct: true
      });
      
      // Process each quotation to add related data
      const quotationsWithData = [];
      
      for (const quotation of rows) {
        const quotationData = quotation.toJSON();
        
        // Fetch QuotationItems with proper Item data
        try {
          const quotationItems = await QuotationItem.findAll({
            where: { 
              quotation_id: quotation.quotation_id,
              is_active: true 
            },
            include: [{ 
              model: Item,
              attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price'],
              required: false
            }],
            raw: false
          });
          
          quotationData.QuotationItems = quotationItems.map(qi => {
            const itemData = qi.toJSON();
            if (itemData.Item) {
              return {
                quotation_item_id: itemData.quotation_item_id,
                quotation_id: itemData.quotation_id,
                item_id: itemData.item_id,
                requested_quantity: itemData.requested_quantity,
                unit_of_measure: itemData.unit_of_measure,
                specifications: itemData.specifications,
                is_active: itemData.is_active,
                Item: {
                  item_id: itemData.Item.item_id,
                  item_code: itemData.Item.item_code,
                  item_name: itemData.Item.item_name,
                  unit_of_measure: itemData.Item.unit_of_measure,
                  price: itemData.Item.price
                }
              };
            } else {
              return {
                quotation_item_id: itemData.quotation_item_id,
                quotation_id: itemData.quotation_id,
                item_id: itemData.item_id,
                requested_quantity: itemData.requested_quantity,
                unit_of_measure: itemData.unit_of_measure,
                specifications: itemData.specifications,
                is_active: itemData.is_active,
                Item: {
                  item_id: itemData.item_id,
                  item_code: 'N/A',
                  item_name: 'Item Not Found',
                  unit_of_measure: itemData.unit_of_measure || 'Unit',
                  price: 0
                }
              };
            }
          });
        } catch (itemError) {
          logger.warn(`Error fetching items for quotation ${quotation.quotation_id}:`, itemError.message);
          quotationData.QuotationItems = [];
        }
        
        // ✅ FIXED - Fetch RetailerQuotations with correct column names
        try {
          const retailerQuotations = await RetailerQuotation.findAll({
            where: { quotation_id: quotation.quotation_id },
            include: [
              { 
                model: RetailerDetails,
                attributes: [
                  'retailer_id', 
                  'retailer_name', 
                  'owner_name', 
                  'phone_primary'
                ],
                required: false,
                include: [{ 
                  model: User, 
                  attributes: ['user_id', 'username', 'email'],
                  required: false
                }]
              }
            ]
          });
          
          quotationData.RetailerQuotations = retailerQuotations.map(rq => rq.toJSON());
        } catch (retailerError) {
          logger.warn(`Error fetching retailer quotations for ${quotation.quotation_id}:`, retailerError.message);
          quotationData.RetailerQuotations = [];
        }
        
        // Add summary data
        quotationData.item_count = quotationData.QuotationItems.length;
        quotationData.response_count = quotationData.RetailerQuotations.filter(
          rq => rq.status === 'submitted'
        ).length;
        
        quotationsWithData.push(quotationData);
      }
      
      return {
        quotations: quotationsWithData,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
      
    } catch (error) {
      logger.error('Get quotations error:', error);
      logger.error('Full error stack:', error.stack);
      throw error;
    }
  }

  // ✅ FIXED - Get quotation by ID with proper data structure
  async getQuotationById(id, userType = null, userId = null) {
    try {
      const quotation = await Quotation.findByPk(id, {
        include: [
          { 
            model: QuotationStatus,
            attributes: ['status_id', 'status_name']
          },
          { 
            model: User, 
            as: 'quotationCreator', 
            attributes: ['user_id', 'username', 'email'] 
          }
        ]
      });
      
      if (!quotation) {
        throw new Error('Quotation not found');
      }
      
      if (userType === 'store' && quotation.created_by !== userId) {
        throw new Error('Access denied');
      }
      
      const quotationData = quotation.toJSON();
      
      // Fetch QuotationItems separately with proper structure
      try {
        const quotationItems = await QuotationItem.findAll({
          where: { 
            quotation_id: id,
            is_active: true 
          },
          include: [{ 
            model: Item,
            attributes: ['item_id', 'item_code', 'item_name', 'unit_of_measure', 'price'],
            required: false
          }]
        });
        
        quotationData.QuotationItems = quotationItems.map(qi => {
          const itemData = qi.toJSON();
          if (itemData.Item) {
            return {
              quotation_item_id: itemData.quotation_item_id,
              quotation_id: itemData.quotation_id,
              item_id: itemData.item_id,
              requested_quantity: itemData.requested_quantity,
              unit_of_measure: itemData.unit_of_measure,
              specifications: itemData.specifications,
              is_active: itemData.is_active,
              Item: {
                item_id: itemData.Item.item_id,
                item_code: itemData.Item.item_code,
                item_name: itemData.Item.item_name,
                unit_of_measure: itemData.Item.unit_of_measure,
                price: itemData.Item.price
              }
            };
          } else {
            return {
              quotation_item_id: itemData.quotation_item_id,
              quotation_id: itemData.quotation_id,
              item_id: itemData.item_id,
              requested_quantity: itemData.requested_quantity,
              unit_of_measure: itemData.unit_of_measure,
              specifications: itemData.specifications,
              is_active: itemData.is_active,
              Item: {
                item_id: itemData.item_id,
                item_code: 'N/A',
                item_name: 'Item Not Found',
                unit_of_measure: itemData.unit_of_measure || 'Unit',
                price: 0
              }
            };
          }
        });
      } catch (itemError) {
        logger.warn(`Error fetching items for quotation ${id}:`, itemError.message);
        quotationData.QuotationItems = [];
      }
      
      // Initialize retailer quotations
      quotationData.RetailerQuotations = [];
      
      // ✅ FIXED - Fetch retailer quotations with correct column names
      try {
        const retailerQuotations = await RetailerQuotation.findAll({
          where: { quotation_id: id },
          include: [
            { 
              model: RetailerDetails,
              attributes: [
                'retailer_id', 
                'retailer_name', 
                'owner_name', 
                'email_primary',
                'phone_primary'
              ],
              required: false
            }
          ]
        });
        
        if (retailerQuotations && retailerQuotations.length > 0) {
          const retailerQuotationIds = retailerQuotations.map(rq => rq.retailer_quotation_id);
          
          // Fetch all retailer quotation items with item details
          const itemsData = await sequelize.query(
            `SELECT 
              rqi.retailer_quotation_item_id,
              rqi.retailer_quotation_id,
              rqi.quotation_item_id,
              rqi.unit_price,
              rqi.quantity,
              rqi.total_amount,
              rqi.notes,
              qi.item_id,
              i.item_code,
              i.item_name,
              qi.unit_of_measure,
              qi.requested_quantity
            FROM retailer_quotation_item rqi
            LEFT JOIN quotation_item qi ON rqi.quotation_item_id = qi.quotation_item_id
            LEFT JOIN item i ON qi.item_id = i.item_id
            WHERE rqi.retailer_quotation_id IN (:retailerQuotationIds)`,
            {
              replacements: { retailerQuotationIds },
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          // Map items to responses
          retailerQuotations.forEach(rq => {
            const rqData = rq.toJSON();
            rqData.RetailerQuotationItems = itemsData
              .filter(item => item.retailer_quotation_id === rq.retailer_quotation_id)
              .map(item => ({
                retailer_quotation_item_id: item.retailer_quotation_item_id,
                retailer_quotation_id: item.retailer_quotation_id,
                quotation_item_id: item.quotation_item_id,
                unit_price: item.unit_price,
                quantity: item.quantity,
                total_amount: item.total_amount,
                notes: item.notes,
                Item: {
                  item_id: item.item_id,
                  item_code: item.item_code,
                  item_name: item.item_name,
                  unit_of_measure: item.unit_of_measure,
                  requested_quantity: item.requested_quantity
                }
              }));
            
            quotationData.RetailerQuotations.push(rqData);
          });
        }
      } catch (retailerError) {
        logger.warn(`Could not fetch retailer quotations for quotation ${id}:`, retailerError.message);
      }
      
      return quotationData;
    } catch (error) {
      logger.error('Get quotation by ID error:', error);
      throw error;
    }
  }

  // ✅ Update quotation
  async updateQuotation(id, updateData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const quotation = await Quotation.findByPk(id);
      
      if (!quotation) {
        throw new Error('Quotation not found');
      }
      
      if ('stock_request_id' in updateData && !updateData.stock_request_id) {
        updateData.stock_request_id = null;
      }
      
      await quotation.update(updateData, { transaction });
      
      await transaction.commit();
      
      return await this.getQuotationById(id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Update quotation error:', error);
      throw error;
    }
  }

  // ✅ Update quotation status
  async updateQuotationStatus(quotationId, statusName, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const quotation = await Quotation.findByPk(quotationId, {
        include: [
          { model: QuotationStatus, as: 'QuotationStatus' }
        ],
        transaction
      });

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      const currentStatus = quotation.QuotationStatus?.status_name;
      
      const validTransitions = {
        'draft': ['published', 'cancelled'],
        'published': ['closed', 'cancelled', 'awarded'],
        'closed': ['awarded', 'published'],
        'awarded': [],
        'cancelled': []
      };

      if (currentStatus === 'awarded' && statusName !== 'awarded') {
        throw new Error('Cannot change status of an awarded quotation');
      }

      if (currentStatus === 'cancelled' && statusName !== 'cancelled') {
        throw new Error('Cannot change status of a cancelled quotation');
      }

      const allowedTransitions = validTransitions[currentStatus] || [];
      if (!allowedTransitions.includes(statusName) && currentStatus !== statusName) {
        logger.warn(`Invalid status transition attempt: ${currentStatus} → ${statusName}`);
      }

      const newStatus = await QuotationStatus.findOne({
        where: { status_name: statusName },
        transaction
      });

      if (!newStatus) {
        throw new Error(`Status '${statusName}' not found in database`);
      }

      await quotation.update({
        status_id: newStatus.status_id,
        updated_by: userId,
        updated_on: new Date()
      }, { transaction });

      await transaction.commit();

      logger.info(`Quotation ${quotationId} status updated: ${currentStatus} → ${statusName}`);

      return await this.getQuotationById(quotationId);

    } catch (error) {
      await transaction.rollback();
      logger.error('Update quotation status error:', error);
      throw error;
    }
  }

  // ✅ Submit retailer quotation
  async submitRetailerQuotation(responseData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { quotation_id, retailer_id, items, notes } = responseData;
      
      logger.info('Submitting retailer quotation:', { 
        quotation_id, 
        retailer_id, 
        items_count: items.length 
      });
      
      const quotation = await Quotation.findByPk(quotation_id, { transaction });
      if (!quotation || !quotation.is_active) {
        throw new Error('Quotation not found or inactive');
      }

      if (new Date() > new Date(quotation.validity_until)) {
        throw new Error('Quotation has expired');
      }

      const existingResponse = await RetailerQuotation.findOne({
        where: { 
          quotation_id: quotation_id, 
          retailer_id: retailer_id 
        },
        transaction
      });
      
      if (existingResponse && existingResponse.status === 'submitted') {
        throw new Error('You have already submitted a response to this quotation');
      }
      
      let total_amount = 0;
      items.forEach(item => {
        const itemTotal = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
        total_amount += itemTotal;
      });

      let retailerQuotation;
      
      if (existingResponse) {
        await existingResponse.update({
          status: 'submitted',
          submitted_on: new Date(),
          total_amount,
          notes
        }, { transaction });
        
        retailerQuotation = existingResponse;
        
        await RetailerQuotationItem.destroy({
          where: { retailer_quotation_id: existingResponse.retailer_quotation_id },
          transaction
        });
      } else {
        retailerQuotation = await RetailerQuotation.create({
          quotation_id: quotation_id,
          retailer_id: retailer_id,
          status: 'submitted',
          submitted_on: new Date(),
          total_amount,
          notes
        }, { transaction });
      }

      const retailerItems = items.map(item => ({
        retailer_quotation_id: retailerQuotation.retailer_quotation_id,
        quotation_item_id: item.quotation_item_id,
        unit_price: parseFloat(item.unit_price || 0),
        quantity: parseFloat(item.quantity || 0),
        total_amount: parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0),
        notes: item.notes || null,
        is_awarded: false,
        awarded_on: null,
        awarded_by: null
      }));

      await RetailerQuotationItem.bulkCreate(retailerItems, { 
        transaction,
        returning: true,
        individualHooks: false
      });

      await transaction.commit();

      logger.info(`Retailer ${retailer_id} successfully submitted quotation for ${quotation_id}`);

      return {
        retailer_quotation_id: retailerQuotation.retailer_quotation_id,
        quotation_id: retailerQuotation.quotation_id,
        retailer_id: retailerQuotation.retailer_id,
        status: 'submitted',
        submitted_on: retailerQuotation.submitted_on,
        total_amount: retailerQuotation.total_amount,
        notes: retailerQuotation.notes,
        message: 'Quotation response submitted successfully',
        items_count: retailerItems.length
      };
      
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Submit retailer quotation error:', error.message);
      logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  // ✅ FIXED - Get retailer responses with correct column names
  async getRetailerResponses(quotationId) {
    try {
      const responses = await RetailerQuotation.findAll({
        where: { quotation_id: quotationId },
        include: [
          {
            model: RetailerDetails,
            attributes: [
              'retailer_id', 
              'retailer_name', 
              'owner_name', 
              'email_primary', 
              'phone_primary',
              'retailer_code',
              'gst_number'
            ],
            required: false,
            include: [{ 
              model: User, 
              attributes: ['user_id', 'username', 'email'],
              required: false
            }]
          }
        ],
        order: [['submitted_on', 'DESC']]
      });
      
      if (responses.length > 0) {
        const retailerQuotationIds = responses.map(r => r.retailer_quotation_id);
        
        const itemsData = await sequelize.query(
          `SELECT 
            rqi.retailer_quotation_item_id as id,
            rqi.retailer_quotation_id,
            rqi.quotation_item_id,
            rqi.unit_price,
            rqi.quantity,
            rqi.total_amount,
            rqi.notes,
            qi.item_id,
            qi.unit_of_measure,
            qi.requested_quantity,
            i.item_code,
            i.item_name
          FROM retailer_quotation_item rqi
          LEFT JOIN quotation_item qi ON rqi.quotation_item_id = qi.quotation_item_id
          LEFT JOIN item i ON qi.item_id = i.item_id
          WHERE rqi.retailer_quotation_id IN (:retailerQuotationIds)`,
          {
            replacements: { retailerQuotationIds },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        responses.forEach(response => {
          const items = itemsData.filter(
            item => item.retailer_quotation_id === response.retailer_quotation_id
          );
          
          response.dataValues.RetailerQuotationItems = items.map(item => ({
            retailer_quotation_item_id: item.id,
            retailer_quotation_id: item.retailer_quotation_id,
            quotation_item_id: item.quotation_item_id,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_amount: item.total_amount,
            notes: item.notes,
            item_id: item.item_id,
            item_code: item.item_code,
            item_name: item.item_name,
            unit_of_measure: item.unit_of_measure,
            requested_quantity: item.requested_quantity,
            Item: {
              item_id: item.item_id,
              item_code: item.item_code,
              item_name: item.item_name,
              unit_of_measure: item.unit_of_measure
            },
            QuotationItem: {
              item_id: item.item_id,
              unit_of_measure: item.unit_of_measure,
              Item: {
                item_id: item.item_id,
                item_code: item.item_code,
                item_name: item.item_name,
                unit_of_measure: item.unit_of_measure
              }
            }
          }));
        });
      }
      
      return responses;
    } catch (error) {
      logger.error('Get retailer responses error:', error);
      throw error;
    }
  }

  // ✅ Generate quotation number
  async generateQuotationNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastQuotation = await Quotation.findOne({
      where: {
        quotation_number: {
          [Op.like]: `QT-${year}${month}%`
        }
      },
      order: [['quotation_number', 'DESC']]
    });
    
    let sequence = 1;
    if (lastQuotation) {
      const lastNumber = lastQuotation.quotation_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `QT-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // ✅ FIXED - Get award comparison data with correct column names
  async getAwardComparisonData(quotationId) {
    try {
      const quotation = await this.getQuotationById(quotationId);

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      const isExpired = new Date() > new Date(quotation.validity_until);
      const isClosed = quotation.QuotationStatus?.status_name === 'closed';

      if (!isExpired && !isClosed) {
        throw new Error('Cannot award quotation before expiry date or manual closure');
      }

      const retailerQuotations = await RetailerQuotation.findAll({
        where: { 
          quotation_id: quotationId,
          status: 'submitted'
        },
        include: [
          { 
            model: RetailerDetails,
            attributes: [
              'retailer_id', 
              'retailer_name', 
              'owner_name',
              'phone_primary',
              'email_primary'
            ],
            include: [{ 
              model: User, 
              attributes: ['user_id', 'username', 'email'],
              required: false
            }],
            required: false
          }
        ]
      });

      let retailerQuotationItems = [];
      if (retailerQuotations.length > 0) {
        const retailerQuotationIds = retailerQuotations.map(rq => rq.retailer_quotation_id);
        
        retailerQuotationItems = await sequelize.query(
          `SELECT 
            rqi.retailer_quotation_item_id,
            rqi.retailer_quotation_id,
            rqi.quotation_item_id,
            rqi.unit_price,
            rqi.quantity,
            rqi.total_amount,
            rqi.notes
          FROM retailer_quotation_item rqi
          WHERE rqi.retailer_quotation_id IN (:retailerQuotationIds)`,
          {
            replacements: { retailerQuotationIds },
            type: sequelize.QueryTypes.SELECT
          }
        );
      }

      const comparisonData = (quotation.QuotationItems || []).map(quotationItem => {
        const retailerPrices = [];
        
        retailerQuotations.forEach(retailerQuotation => {
          const retailerItem = retailerQuotationItems.find(
            ri => ri.retailer_quotation_id === retailerQuotation.retailer_quotation_id &&
                  ri.quotation_item_id === quotationItem.quotation_item_id
          );

          if (retailerItem) {
            retailerPrices.push({
              retailer_quotation_id: retailerQuotation.retailer_quotation_id,
              retailer_quotation_item_id: retailerItem.retailer_quotation_item_id,
              retailer_id: retailerQuotation.retailer_id,
              retailer_name: retailerQuotation.RetailerDetails?.retailer_name || 'Unknown',
              retailer_email: retailerQuotation.RetailerDetails?.User?.email,
              unit_price: parseFloat(retailerItem.unit_price),
              quantity: parseFloat(retailerItem.quantity),
              total_amount: retailerItem.total_amount || (parseFloat(retailerItem.unit_price) * parseFloat(retailerItem.quantity)),
              notes: retailerItem.notes,
              is_awarded: false
            });
          }
        });

        retailerPrices.sort((a, b) => a.unit_price - b.unit_price);

        return {
          quotation_item_id: quotationItem.quotation_item_id,
          item_id: quotationItem.item_id,
          item_code: quotationItem.Item?.item_code,
          item_name: quotationItem.Item?.item_name,
          requested_quantity: parseFloat(quotationItem.requested_quantity),
          unit_of_measure: quotationItem.unit_of_measure,
          specifications: quotationItem.specifications,
          retailer_prices: retailerPrices,
          lowest_price: retailerPrices.length > 0 ? retailerPrices[0] : null,
          already_awarded: null,
          response_count: retailerPrices.length
        };
      });

      return {
        quotation: {
          quotation_id: quotation.quotation_id,
          quotation_number: quotation.quotation_number,
          quotation_name: quotation.quotation_name,
          validity_until: quotation.validity_until,
          status: quotation.QuotationStatus?.status_name
        },
        items: comparisonData,
        total_items: comparisonData.length,
        items_with_responses: comparisonData.filter(item => item.response_count > 0).length,
        already_awarded_count: 0
      };
    } catch (error) {
      logger.error('Get award comparison data error:', error);
      throw error;
    }
  }

  // ✅ Award quotation
  async awardQuotation(quotationId, awards, awarded_by) {
    const transaction = await sequelize.transaction();
    
    try {
      const quotation = await Quotation.findByPk(quotationId, {
        include: [{ model: QuotationStatus }]
      });

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      const isExpired = new Date() > new Date(quotation.validity_until);
      const isClosed = quotation.QuotationStatus?.status_name === 'closed';

      if (!isExpired && !isClosed) {
        throw new Error('Cannot award quotation before expiry date or manual closure');
      }

      const awardedStatus = await QuotationStatus.findOne({
        where: { status_name: 'awarded' },
        transaction
      });

      if (awardedStatus) {
        await quotation.update({
          status_id: awardedStatus.status_id
        }, { transaction });
      }

      await transaction.commit();

      logger.info('Quotation awarded successfully:', {
        quotation_id: quotationId,
        awarded_by: awarded_by,
        items_awarded: awards.length
      });

      try {
        await notifyQuotationAwarded(quotationId, awards);
      } catch (notifyError) {
        logger.error('Failed to send award notifications (non-critical):', notifyError);
      }

      return {
        quotation_id: quotationId,
        message: 'Quotation awarded successfully',
        items_awarded: awards.length
      };
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Award quotation error:', error);
      throw error;
    }
  }

  // ✅ Delete quotation
  async deleteQuotation(quotationId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const quotation = await Quotation.findByPk(quotationId, { transaction });

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      await quotation.update({
        is_active: false,
        updated_by: userId,
        updated_on: new Date()
      }, { transaction });

      await transaction.commit();

      logger.info(`Quotation ${quotationId} deleted by user ${userId}`);

      return { message: 'Quotation deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      logger.error('Delete quotation error:', error);
      throw error;
    }
  }

  // ✅ Get quotations for retailer
  async getQuotationsForRetailer(retailerId, { page = 1, limit = 10, status }) {
    try {
      const offset = (page - 1) * limit;
      const where = { 
        is_active: true,
        validity_until: {
          [Op.gte]: new Date()
        }
      };
      
      if (status) {
        where.status_id = status;
      }

      const { count, rows } = await Quotation.findAndCountAll({
        where,
        include: [
          { 
            model: QuotationStatus,
            attributes: ['status_id', 'status_name']
          },
          { 
            model: User, 
            as: 'quotationCreator', 
            attributes: ['user_id', 'username', 'email'] 
          }
        ],
        limit,
        offset,
        order: [['created_on', 'DESC']],
        distinct: true
      });

      if (rows.length > 0) {
        const quotationIds = rows.map(q => q.quotation_id);
        
        const retailerResponses = await RetailerQuotation.findAll({
          where: {
            quotation_id: quotationIds,
            retailer_id: retailerId
          },
          attributes: ['quotation_id', 'status', 'submitted_on', 'total_amount']
        });

        const quotationsWithResponses = rows.map(quotation => {
          const quotationData = quotation.toJSON();
          const response = retailerResponses.find(r => r.quotation_id === quotation.quotation_id);
          
          quotationData.retailer_response = response || null;
          quotationData.has_responded = !!response;
          
          return quotationData;
        });

        return {
          quotations: quotationsWithResponses,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        };
      }

      return {
        quotations: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      };
    } catch (error) {
      logger.error('Get quotations for retailer error:', error);
      throw error;
    }
  }
}

export default new QuotationService();