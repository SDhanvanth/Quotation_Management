// controllers/quotation.controller.js (COMPLETE FILE)
import quotationService from '../services/quotation.service.js';
import { QuotationHistory, RetailerDetails } from '../models/index.js';
import logger from '../config/logger.js';

// Create quotation from stock requests
export const createQuotationFromStockRequests = async (req, res, next) => {
  try {
    const { request_item_ids, validity_until, notes } = req.body;

    if (!request_item_ids || request_item_ids.length === 0) {
      return res.status(400).json({ error: 'Request item IDs are required' });
    }

    const quotation = await quotationService.createQuotationFromStockRequests({
      validity_until,
      notes,
      created_by: req.user.user_id
    }, request_item_ids);

    await QuotationHistory.create({
      quotation_id: quotation.quotation_id,
      action: 'CREATE_FROM_STOCK_REQUESTS',
      new_value: JSON.stringify({ 
        quotation_id: quotation.quotation_id,
        request_item_ids 
      }),
      changed_by: req.user.user_id
    });

    res.status(201).json({
      message: 'Quotation created successfully from stock requests',
      quotation
    });
  } catch (error) {
    next(error);
  }
};

// Create regular quotation
export const createQuotation = async (req, res, next) => {
  try {
    const quotationData = {
      ...req.body,
      created_by: req.user.user_id
    };
    
    const quotation = await quotationService.createQuotation(quotationData);
    
    await QuotationHistory.create({
      quotation_id: quotation.quotation_id,
      action: 'CREATE',
      new_value: JSON.stringify(quotation),
      changed_by: req.user.user_id
    });

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation
    });
  } catch (error) {
    next(error);
  }
};

// Get all quotations
export const getQuotations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const quotations = await quotationService.getQuotations({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      search,
      userType: req.user.UserType.type_name,
      userId: req.user.user_id
    });

    res.json(quotations);
  } catch (error) {
    next(error);
  }
};

// Get quotation by ID
export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(
      req.params.id,
      req.user.UserType.type_name,
      req.user.user_id
    );

    res.json(quotation);
  } catch (error) {
    next(error);
  }
};

// Update quotation
export const updateQuotation = async (req, res, next) => {
  try {
    const oldQuotation = await quotationService.getQuotationById(req.params.id);
    const updatedQuotation = await quotationService.updateQuotation(
      req.params.id,
      req.body,
      req.user.user_id
    );

    await QuotationHistory.create({
      quotation_id: updatedQuotation.quotation_id,
      action: 'UPDATE',
      old_value: JSON.stringify(oldQuotation),
      new_value: JSON.stringify(updatedQuotation),
      changed_by: req.user.user_id
    });

    res.json({
      message: 'Quotation updated successfully',
      quotation: updatedQuotation
    });
  } catch (error) {
    next(error);
  }
};

// ✅ NEW - Update quotation status (for closing early, cancelling, etc.)
export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    logger.info('Updating quotation status:', {
      quotation_id: id,
      new_status: status,
      user_id: req.user.user_id
    });

    // Get old quotation for history
    const oldQuotation = await quotationService.getQuotationById(id);

    // Update status
    const updatedQuotation = await quotationService.updateQuotationStatus(
      id,
      status,
      req.user.user_id
    );

    // Log to history
    await QuotationHistory.create({
      quotation_id: id,
      action: 'STATUS_UPDATE',
      old_value: oldQuotation.QuotationStatus?.status_name || 'unknown',
      new_value: status,
      changed_by: req.user.user_id
    });

    res.json({
      success: true,
      message: `Quotation status updated to '${status}' successfully`,
      quotation: updatedQuotation
    });
  } catch (error) {
    logger.error('Update quotation status error:', error);
    next(error);
  }
};

// Submit retailer quotation
export const submitRetailerQuotation = async (req, res, next) => {
  try {
    logger.info('Submit retailer quotation - User ID:', req.user.user_id);

    const retailerDetails = await RetailerDetails.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!retailerDetails) {
      logger.error('Retailer details not found in database for user_id:', req.user.user_id);
      return res.status(400).json({ 
        error: 'Retailer details not found. Please complete your profile.' 
      });
    }

    const retailerId = retailerDetails.retailer_id;

    logger.info('Submit retailer quotation:', {
      quotation_id: req.params.id,
      retailer_id: retailerId,
      user_id: req.user.user_id,
      items_count: req.body.items?.length
    });

    const retailerQuotation = await quotationService.submitRetailerQuotation({
      quotation_id: parseInt(req.params.id),
      retailer_id: retailerId,
      items: req.body.items,
      notes: req.body.notes
    });

    // Log to history
    await QuotationHistory.create({
      quotation_id: req.params.id,
      action: 'RETAILER_RESPONSE_SUBMITTED',
      new_value: JSON.stringify({
        retailer_id: retailerId,
        items_count: req.body.items?.length
      }),
      changed_by: req.user.user_id
    });

    res.status(201).json({
      message: 'Retailer quotation submitted successfully',
      retailerQuotation
    });
  } catch (error) {
    logger.error('Submit retailer quotation error:', error);
    next(error);
  }
};

// Get retailer responses for a quotation
export const getRetailerResponses = async (req, res, next) => {
  try {
    const responses = await quotationService.getRetailerResponses(req.params.id);
    
    res.json({
      message: 'Retailer responses retrieved successfully',
      responses
    });
  } catch (error) {
    next(error);
  }
};

// Get award comparison data
export const getAwardComparison = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.info('Getting award comparison for quotation:', id);
    
    const comparison = await quotationService.getAwardComparisonData(id);
    
    res.json({
      message: 'Award comparison data retrieved successfully',
      data: comparison
    });
  } catch (error) {
    logger.error('Get award comparison error:', error);
    next(error);
  }
};

// Award quotation items
export const awardQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { awards } = req.body; // Array of { quotation_item_id, retailer_quotation_item_id }
    
    if (!awards || !Array.isArray(awards) || awards.length === 0) {
      return res.status(400).json({ 
        error: 'Awards array is required with at least one item' 
      });
    }

    // ✅ Validate: Each quotation_item_id should appear only once
    const itemIds = awards.map(a => a.quotation_item_id);
    const uniqueItemIds = new Set(itemIds);
    
    if (itemIds.length !== uniqueItemIds.size) {
      return res.status(400).json({ 
        error: 'Invalid awards: Each item can only be awarded to one retailer' 
      });
    }

    // ✅ Validate: Each award has required fields
    for (const award of awards) {
      if (!award.quotation_item_id || !award.retailer_quotation_item_id) {
        return res.status(400).json({ 
          error: 'Invalid award data: Missing quotation_item_id or retailer_quotation_item_id' 
        });
      }
    }

    logger.info('Awarding quotation:', {
      quotation_id: id,
      awards_count: awards.length,
      awarded_by: req.user.user_id,
      awards
    });

    const result = await quotationService.awardQuotation(
      id,
      awards,
      req.user.user_id
    );

    // Log to history
    await QuotationHistory.create({
      quotation_id: id,
      action: 'AWARD',
      new_value: JSON.stringify({
        awards_count: awards.length,
        total_value: result.total_award_value,
        retailers_count: result.unique_retailers_count,
        awards
      }),
      changed_by: req.user.user_id
    });

    res.json({
      message: `Successfully awarded ${awards.length} item(s)`,
      result
    });
  } catch (error) {
    logger.error('Award quotation error:', error);
    next(error);
  }
};

// Delete/Cancel quotation
export const deleteQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await quotationService.deleteQuotation(id, req.user.user_id);

    await QuotationHistory.create({
      quotation_id: id,
      action: 'DELETE',
      old_value: JSON.stringify({ quotation_id: id }),
      changed_by: req.user.user_id
    });

    res.json({
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Export quotation
export const exportQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    logger.info('Exporting quotation:', { quotation_id: id, format });

    const fileBuffer = await quotationService.exportQuotation(id, format);

    const filename = `quotation_${id}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    logger.error('Export quotation error:', error);
    next(error);
  }
};

export default {
  createQuotation,
  createQuotationFromStockRequests,
  getQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  submitRetailerQuotation,
  getRetailerResponses,
  getAwardComparison,
  awardQuotation,
  exportQuotation
};