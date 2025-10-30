// controllers/report.controller.js
import reportService from '../services/report.service.js';
import logger from '../config/logger.js';

// ==================== ITEM REPORTS ====================
export const getItemReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      category_id: req.query.category_id,
      is_active: req.query.is_active
    };

    const items = await reportService.generateItemReport(filters);

    res.json({
      message: 'Item report generated successfully',
      count: items.length,
      data: items
    });
  } catch (error) {
    logger.error('Get item report error:', error);
    next(error);
  }
};

export const exportItemReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      category_id: req.query.category_id,
      is_active: req.query.is_active
    };

    const items = await reportService.generateItemReport(filters);
    const workbook = await reportService.exportItemsToExcel(items, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=items_report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export item report error:', error);
    next(error);
  }
};

// ==================== STOCK REPORTS ====================
export const getStockReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      store_id: req.query.store_id,
      low_stock_only: req.query.low_stock_only
    };

    const stocks = await reportService.generateStockReport(filters);

    res.json({
      message: 'Stock report generated successfully',
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    logger.error('Get stock report error:', error);
    next(error);
  }
};

export const exportStockReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      store_id: req.query.store_id,
      low_stock_only: req.query.low_stock_only
    };

    const stocks = await reportService.generateStockReport(filters);
    const workbook = await reportService.exportStockToExcel(stocks, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stock_report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export stock report error:', error);
    next(error);
  }
};

// ==================== STORE REPORTS ====================
export const getStoreReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      is_active: req.query.is_active
    };

    const stores = await reportService.generateStoreReport(filters);

    res.json({
      message: 'Store report generated successfully',
      count: stores.length,
      data: stores
    });
  } catch (error) {
    logger.error('Get store report error:', error);
    next(error);
  }
};

export const exportStoreReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      is_active: req.query.is_active
    };

    const stores = await reportService.generateStoreReport(filters);
    const workbook = await reportService.exportStoresToExcel(stores, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stores_report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export store report error:', error);
    next(error);
  }
};

// ==================== RETAILER REPORTS ====================
export const getRetailerReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      is_verified: req.query.is_verified
    };

    const retailers = await reportService.generateRetailerReport(filters);

    res.json({
      message: 'Retailer report generated successfully',
      count: retailers.length,
      data: retailers
    });
  } catch (error) {
    logger.error('Get retailer report error:', error);
    next(error);
  }
};

export const exportRetailerReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      is_verified: req.query.is_verified
    };

    const retailers = await reportService.generateRetailerReport(filters);
    const workbook = await reportService.exportRetailersToExcel(retailers, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=retailers_report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export retailer report error:', error);
    next(error);
  }
};

// ==================== QUOTATION REPORTS ====================
export const getQuotationReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status_id: req.query.status_id,
      quotation_type: req.query.quotation_type,
      created_by: req.query.created_by
    };

    const quotations = await reportService.generateQuotationReport(filters);

    res.json({
      message: 'Quotation report generated successfully',
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    logger.error('Get quotation report error:', error);
    next(error);
  }
};

export const exportQuotationReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status_id: req.query.status_id,
      quotation_type: req.query.quotation_type,
      created_by: req.query.created_by
    };

    const quotations = await reportService.generateQuotationReport(filters);
    const workbook = await reportService.exportQuotationsToExcel(quotations, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=quotations_report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export quotation report error:', error);
    next(error);
  }
};

export default {
  getItemReport,
  exportItemReport,
  getStockReport,
  exportStockReport,
  getStoreReport,
  exportStoreReport,
  getRetailerReport,
  exportRetailerReport,
  getQuotationReport,
  exportQuotationReport
};