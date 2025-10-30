// services/report.service.js
import ExcelJS from 'exceljs';
import { 
  Item, 
  Category, 
  Stock, 
  Store, 
  Quotation, 
  QuotationItem, 
  QuotationStatus, 
  User, 
  RetailerQuotation,
  RetailerQuotationItem,
  RetailerDetails 
} from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class ReportService {
  
  // ==================== ITEM REPORT ====================
  async generateItemReport(filters) {
    try {
      const { startDate, endDate, category_id, is_active } = filters;

      const where = {};

      // ✅ FIXED: Date filter with end date adjustment
      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.between]: [new Date(startDate), adjustedEndDate]
        };
      } else if (startDate) {
        where.created_on = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.lte]: adjustedEndDate
        };
      }

      // Category filter
      if (category_id) {
        where.category_id = category_id;
      }

      // Active status filter
      if (is_active !== undefined && is_active !== '') {
        where.is_active = is_active === 'true' || is_active === true;
      }

      logger.info('Item report filters:', { where, filters });

      const items = await Item.findAll({
        where,
        include: [
          { model: Category, attributes: ['category_name'] }
        ],
        order: [['created_on', 'DESC']]
      });

      logger.info(`Found ${items.length} items`);

      return items;
    } catch (error) {
      logger.error('Generate item report error:', error);
      throw error;
    }
  }

  async exportItemsToExcel(items, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Items Report');

      worksheet.properties.defaultRowHeight = 20;

      // Add title
      worksheet.mergeCells('A1:H1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = 'ITEMS REPORT';
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add filters info
      worksheet.mergeCells('A2:H2');
      const filterRow = worksheet.getCell('A2');
      filterRow.value = this.getFilterText(filters);
      filterRow.font = { size: 10, italic: true };
      filterRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add headers
      const headerRow = worksheet.addRow([
        'Item Code',
        'Item Name',
        'Category',
        'Unit of Measure',
        'Price',
        'Status',
        'Created On',
        'Updated On'
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add data rows
      items.forEach(item => {
        const row = worksheet.addRow([
          item.item_code,
          item.item_name,
          item.Category?.category_name || 'N/A',
          item.unit_of_measure,
          item.price,
          item.is_active ? 'Active' : 'Inactive',
          new Date(item.created_on).toLocaleDateString(),
          new Date(item.updated_on).toLocaleDateString()
        ]);

        if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });

      worksheet.columns = [
        { key: 'item_code', width: 15 },
        { key: 'item_name', width: 30 },
        { key: 'category', width: 20 },
        { key: 'unit', width: 15 },
        { key: 'price', width: 12 },
        { key: 'status', width: 12 },
        { key: 'created', width: 15 },
        { key: 'updated', width: 15 }
      ];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      worksheet.addRow([]);
      worksheet.addRow(['Total Items:', items.length]);
      worksheet.addRow(['Active Items:', items.filter(i => i.is_active).length]);
      worksheet.addRow(['Inactive Items:', items.filter(i => !i.is_active).length]);

      return workbook;
    } catch (error) {
      logger.error('Export items to Excel error:', error);
      throw error;
    }
  }

  // ==================== STOCK REPORT ====================
  async generateStockReport(filters) {
    try {
      const { startDate, endDate, store_id, low_stock_only } = filters;

      const where = {};

      // ✅ FIXED: Date filter
      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.between]: [new Date(startDate), adjustedEndDate]
        };
      } else if (startDate) {
        where.created_on = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.lte]: adjustedEndDate
        };
      }

      if (store_id) {
        where.store_id = store_id;
      }

      logger.info('Stock report filters:', { where, filters });

      const stocks = await Stock.findAll({
        where,
        include: [
          { 
            model: Item, 
            attributes: ['item_code', 'item_name', 'unit_of_measure', 'price'],
            include: [{ model: Category, attributes: ['category_name'] }]
          },
          { 
            model: Store, 
            attributes: ['store_name', 'location']
          }
        ],
        order: [['created_on', 'DESC']]
      });

      logger.info(`Found ${stocks.length} stock items`);

      let filteredStocks = stocks;
      if (low_stock_only === 'true' || low_stock_only === true) {
        filteredStocks = stocks.filter(stock => 
          stock.current_stock <= stock.minimum_stock && stock.minimum_stock > 0
        );
      }

      return filteredStocks;
    } catch (error) {
      logger.error('Generate stock report error:', error);
      throw error;
    }
  }

  async exportStockToExcel(stocks, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Stock Report');

      worksheet.properties.defaultRowHeight = 20;

      worksheet.mergeCells('A1:J1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = 'STOCK REPORT';
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('A2:J2');
      const filterRow = worksheet.getCell('A2');
      filterRow.value = this.getFilterText(filters);
      filterRow.font = { size: 10, italic: true };
      filterRow.alignment = { vertical: 'middle', horizontal: 'center' };

      const headerRow = worksheet.addRow([
        'Store Name',
        'Item Code',
        'Item Name',
        'Category',
        'Current Stock',
        'Reserved Stock',
        'Available Stock',
        'Min Stock',
        'Unit',
        'Status'
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      stocks.forEach(stock => {
        const available = stock.current_stock - stock.reserved_stock;
        const isLowStock = stock.current_stock <= stock.minimum_stock && stock.minimum_stock > 0;

        const row = worksheet.addRow([
          stock.Store?.store_name || 'N/A',
          stock.Item?.item_code || 'N/A',
          stock.Item?.item_name || 'N/A',
          stock.Item?.Category?.category_name || 'N/A',
          stock.current_stock,
          stock.reserved_stock,
          available,
          stock.minimum_stock,
          stock.Item?.unit_of_measure || 'N/A',
          isLowStock ? 'Low Stock' : 'In Stock'
        ]);

        if (isLowStock) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' }
          };
        } else if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });

      worksheet.columns = [
        { key: 'store', width: 20 },
        { key: 'item_code', width: 15 },
        { key: 'item_name', width: 30 },
        { key: 'category', width: 20 },
        { key: 'current', width: 15 },
        { key: 'reserved', width: 15 },
        { key: 'available', width: 15 },
        { key: 'min', width: 12 },
        { key: 'unit', width: 12 },
        { key: 'status', width: 12 }
      ];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      worksheet.addRow([]);
      worksheet.addRow(['Total Stock Items:', stocks.length]);
      worksheet.addRow(['Low Stock Items:', stocks.filter(s => s.current_stock <= s.minimum_stock && s.minimum_stock > 0).length]);
      worksheet.addRow(['Total Current Stock:', stocks.reduce((sum, s) => sum + s.current_stock, 0)]);
      worksheet.addRow(['Total Reserved Stock:', stocks.reduce((sum, s) => sum + s.reserved_stock, 0)]);

      return workbook;
    } catch (error) {
      logger.error('Export stock to Excel error:', error);
      throw error;
    }
  }

  // ==================== STORE REPORT ====================
  async generateStoreReport(filters) {
    try {
      const { startDate, endDate, is_active } = filters;

      const where = {};

      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.between]: [new Date(startDate), adjustedEndDate]
        };
      } else if (startDate) {
        where.created_on = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.lte]: adjustedEndDate
        };
      }

      if (is_active !== undefined && is_active !== '') {
        where.is_active = is_active === 'true' || is_active === true;
      }

      logger.info('Store report filters:', { where, filters });

      const stores = await Store.findAll({
        where,
        include: [
          { 
            model: User, 
            attributes: ['username', 'email', 'is_approved']
          }
        ],
        order: [['created_on', 'DESC']]
      });

      logger.info(`Found ${stores.length} stores`);

      return stores;
    } catch (error) {
      logger.error('Generate store report error:', error);
      throw error;
    }
  }

  async exportStoresToExcel(stores, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Stores Report');

      worksheet.properties.defaultRowHeight = 20;

      worksheet.mergeCells('A1:I1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = 'STORES REPORT';
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('A2:I2');
      const filterRow = worksheet.getCell('A2');
      filterRow.value = this.getFilterText(filters);
      filterRow.font = { size: 10, italic: true };
      filterRow.alignment = { vertical: 'middle', horizontal: 'center' };

      const headerRow = worksheet.addRow([
        'Store Name',
        'Location',
        'Contact Person',
        'Email',
        'Phone',
        'Status',
        'Approved',
        'Created On',
        'Updated On'
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      stores.forEach(store => {
        const row = worksheet.addRow([
                      store.store_name,
          store.location || 'N/A',
          store.contact_person || 'N/A',
          store.User?.email || 'N/A',
          store.contact_number || 'N/A',
          store.is_active ? 'Active' : 'Inactive',
          store.User?.is_approved ? 'Yes' : 'No',
          new Date(store.created_on).toLocaleDateString(),
          new Date(store.updated_on).toLocaleDateString()
        ]);

        if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });

      worksheet.columns = [
        { key: 'name', width: 25 },
        { key: 'location', width: 30 },
        { key: 'person', width: 20 },
        { key: 'email', width: 25 },
        { key: 'phone', width: 15 },
        { key: 'status', width: 12 },
        { key: 'approved', width: 12 },
        { key: 'created', width: 15 },
        { key: 'updated', width: 15 }
      ];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      worksheet.addRow([]);
      worksheet.addRow(['Total Stores:', stores.length]);
      worksheet.addRow(['Active Stores:', stores.filter(s => s.is_active).length]);
      worksheet.addRow(['Inactive Stores:', stores.filter(s => !s.is_active).length]);

      return workbook;
    } catch (error) {
      logger.error('Export stores to Excel error:', error);
      throw error;
    }
  }

  // ==================== RETAILER REPORT ====================
  async generateRetailerReport(filters) {
    try {
      const { startDate, endDate, is_verified } = filters;

      const where = {};

      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.between]: [new Date(startDate), adjustedEndDate]
        };
      } else if (startDate) {
        where.created_on = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.lte]: adjustedEndDate
        };
      }

      if (is_verified !== undefined && is_verified !== '') {
        where.is_verified = is_verified === 'true' || is_verified === true;
      }

      logger.info('Retailer report filters:', { where, filters });

      const retailers = await RetailerDetails.findAll({
        where,
        include: [
          { 
            model: User, 
            attributes: ['username', 'email', 'is_approved', 'is_active']
          }
        ],
        order: [['created_on', 'DESC']]
      });

      logger.info(`Found ${retailers.length} retailers`);

      return retailers;
    } catch (error) {
      logger.error('Generate retailer report error:', error);
      throw error;
    }
  }

  async exportRetailersToExcel(retailers, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Retailers Report');

      worksheet.properties.defaultRowHeight = 20;

      worksheet.mergeCells('A1:J1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = 'RETAILERS REPORT';
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('A2:J2');
      const filterRow = worksheet.getCell('A2');
      filterRow.value = this.getFilterText(filters);
      filterRow.font = { size: 10, italic: true };
      filterRow.alignment = { vertical: 'middle', horizontal: 'center' };

      const headerRow = worksheet.addRow([
        'Company Name',
        'Contact Person',
        'Email',
        'Phone',
        'Address',
        'GST Number',
        'Verified',
        'Approved',
        'Created On',
        'Updated On'
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      retailers.forEach(retailer => {
        const row = worksheet.addRow([
          retailer.company_name,
          retailer.contact_person || 'N/A',
          retailer.User?.email || 'N/A',
          retailer.contact_number || 'N/A',
          retailer.address || 'N/A',
          retailer.gst_number || 'N/A',
          retailer.is_verified ? 'Yes' : 'No',
          retailer.User?.is_approved ? 'Yes' : 'No',
          new Date(retailer.created_on).toLocaleDateString(),
          new Date(retailer.updated_on).toLocaleDateString()
        ]);

        if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });

      worksheet.columns = [
        { key: 'company', width: 25 },
        { key: 'person', width: 20 },
        { key: 'email', width: 25 },
        { key: 'phone', width: 15 },
        { key: 'address', width: 35 },
        { key: 'gst', width: 20 },
        { key: 'verified', width: 12 },
        { key: 'approved', width: 12 },
        { key: 'created', width: 15 },
        { key: 'updated', width: 15 }
      ];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      worksheet.addRow([]);
      worksheet.addRow(['Total Retailers:', retailers.length]);
      worksheet.addRow(['Verified Retailers:', retailers.filter(r => r.is_verified).length]);
      worksheet.addRow(['Unverified Retailers:', retailers.filter(r => !r.is_verified).length]);

      return workbook;
    } catch (error) {
      logger.error('Export retailers to Excel error:', error);
      throw error;
    }
  }

  // ==================== QUOTATION REPORT (Enhanced) ====================
  async generateQuotationReport(filters) {
    try {
      const { startDate, endDate, status_id, quotation_type, created_by } = filters;

      const where = { is_active: true };

      // ✅ FIXED: Date filter
      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.between]: [new Date(startDate), adjustedEndDate]
        };
      } else if (startDate) {
        where.created_on = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        where.created_on = {
          [Op.lte]: adjustedEndDate
        };
      }

      if (status_id) {
        where.status_id = status_id;
      }

      if (quotation_type) {
        where.quotation_type = quotation_type;
      }

      if (created_by) {
        where.created_by = created_by;
      }

      logger.info('Quotation report filters:', { where, filters });

      const quotations = await Quotation.findAll({
        where,
        include: [
          { 
            model: QuotationStatus,
            attributes: ['status_name']
          },
          { 
            model: User, 
            as: 'quotationCreator',
            attributes: ['username', 'email']
          },
          {
            model: QuotationItem,
            include: [{ 
              model: Item,
              attributes: ['item_code', 'item_name', 'unit_of_measure']
            }]
          },
          {
            model: RetailerQuotation,
            include: [
              {
                model: RetailerQuotationItem,
                include: [{
                  model: QuotationItem,
                  include: [{
                    model: Item,
                    attributes: ['item_code', 'item_name']
                  }]
                }]
              },
              {
                model: RetailerDetails,
                include: [{ 
                  model: User,
                  attributes: ['username', 'email']
                }]
              }
            ]
          }
        ],
        order: [['created_on', 'DESC']]
      });

      logger.info(`Found ${quotations.length} quotations`);

      return quotations;
    } catch (error) {
      logger.error('Generate quotation report error:', error);
      throw error;
    }
  }

  async exportQuotationsToExcel(quotations, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // ===== SUMMARY SHEET =====
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.properties.defaultRowHeight = 20;

      summarySheet.mergeCells('A1:H1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = 'QUOTATIONS REPORT';
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      summarySheet.mergeCells('A2:H2');
      const filterCell = summarySheet.getCell('A2');
      filterCell.value = this.getFilterText(filters);
      filterCell.font = { size: 10, italic: true };
      filterCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const headerRow = summarySheet.addRow([
        'Quotation No',
        'Quotation Name',
        'Type',
        'Status',
        'Items Count',
        'Responses',
        'Created By',
        'Created On'
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      quotations.forEach(quotation => {
        summarySheet.addRow([
          quotation.quotation_number,
          quotation.quotation_name,
          quotation.quotation_type,
          quotation.QuotationStatus?.status_name || 'N/A',
          quotation.QuotationItems?.length || 0,
          quotation.RetailerQuotations?.length || 0,
          quotation.quotationCreator?.username || 'N/A',
          new Date(quotation.created_on).toLocaleDateString()
        ]);
      });

      summarySheet.columns = [
        { key: 'number', width: 20 },
        { key: 'name', width: 30 },
        { key: 'type', width: 15 },
        { key: 'status', width: 15 },
        { key: 'items', width: 12 },
        { key: 'responses', width: 12 },
        { key: 'creator', width: 20 },
        { key: 'created', width: 15 }
      ];

      summarySheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // ===== DETAILED ITEMS SHEET =====
      const detailSheet = workbook.addWorksheet('Quotation Items');
      detailSheet.properties.defaultRowHeight = 20;

      detailSheet.mergeCells('A1:G1');
      const detailTitle = detailSheet.getCell('A1');
      detailTitle.value = 'QUOTATION ITEMS DETAIL';
      detailTitle.font = { size: 16, bold: true };
      detailTitle.alignment = { vertical: 'middle', horizontal: 'center' };

      const detailHeader = detailSheet.addRow([
        'Quotation No',
        'Item Code',
        'Item Name',
        'Requested Qty',
        'Unit',
        'Specifications',
        'Status'
      ]);

      detailHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      detailHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      quotations.forEach(quotation => {
        quotation.QuotationItems?.forEach(item => {
          detailSheet.addRow([
            quotation.quotation_number,
            item.Item?.item_code || 'N/A',
            item.Item?.item_name || 'N/A',
            item.requested_quantity,
            item.unit_of_measure,
            item.specifications || 'N/A',
            quotation.QuotationStatus?.status_name || 'N/A'
          ]);
        });
      });

      detailSheet.columns = [
        { key: 'quotation', width: 20 },
        { key: 'code', width: 15 },
        { key: 'name', width: 30 },
        { key: 'qty', width: 15 },
        { key: 'unit', width: 12 },
        { key: 'specs', width: 30 },
        { key: 'status', width: 15 }
      ];

      detailSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
                        cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // ===== RETAILER RESPONSES SHEET =====
      const responsesSheet = workbook.addWorksheet('Retailer Responses');
      responsesSheet.properties.defaultRowHeight = 20;

      responsesSheet.mergeCells('A1:F1');
      const responseTitle = responsesSheet.getCell('A1');
      responseTitle.value = 'RETAILER RESPONSES SUMMARY';
      responseTitle.font = { size: 16, bold: true };
      responseTitle.alignment = { vertical: 'middle', horizontal: 'center' };

      const responseHeader = responsesSheet.addRow([
        'Quotation No',
        'Retailer Name',
        'Total Amount',
        'Status',
        'Submitted On',
        'Notes'
      ]);

      responseHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      responseHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      quotations.forEach(quotation => {
        quotation.RetailerQuotations?.forEach(response => {
          responsesSheet.addRow([
            quotation.quotation_number,
            response.RetailerDetails?.company_name || response.RetailerDetails?.User?.username || 'N/A',
            response.total_amount || 0,
            response.status || 'N/A',
            response.submitted_on ? new Date(response.submitted_on).toLocaleDateString() : 'N/A',
            response.notes || 'N/A'
          ]);
        });
      });

      responsesSheet.columns = [
        { key: 'quotation', width: 20 },
        { key: 'retailer', width: 25 },
        { key: 'amount', width: 15 },
        { key: 'status', width: 15 },
        { key: 'submitted', width: 15 },
        { key: 'notes', width: 30 }
      ];

      responsesSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // ✅ NEW: DETAILED RETAILER PRICING SHEET
      const pricingSheet = workbook.addWorksheet('Retailer Item Pricing');
      pricingSheet.properties.defaultRowHeight = 20;

      pricingSheet.mergeCells('A1:H1');
      const pricingTitle = pricingSheet.getCell('A1');
      pricingTitle.value = 'RETAILER ITEM-WISE PRICING';
      pricingTitle.font = { size: 16, bold: true };
      pricingTitle.alignment = { vertical: 'middle', horizontal: 'center' };

      const pricingHeader = pricingSheet.addRow([
        'Quotation No',
        'Item Code',
        'Item Name',
        'Retailer Name',
        'Unit Price',
        'Quantity',
        'Total Amount',
        'Notes'
      ]);

      pricingHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      pricingHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      quotations.forEach(quotation => {
        quotation.RetailerQuotations?.forEach(response => {
          response.RetailerQuotationItems?.forEach(item => {
            const totalAmount = (item.unit_price || 0) * (item.quantity || 0);
            
            pricingSheet.addRow([
              quotation.quotation_number,
              item.QuotationItem?.Item?.item_code || 'N/A',
              item.QuotationItem?.Item?.item_name || 'N/A',
              response.RetailerDetails?.company_name || response.RetailerDetails?.User?.username || 'N/A',
              item.unit_price || 0,
              item.quantity || 0,
              totalAmount,
              item.notes || 'N/A'
            ]);
          });
        });
      });

      pricingSheet.columns = [
        { key: 'quotation', width: 20 },
        { key: 'code', width: 15 },
        { key: 'name', width: 30 },
        { key: 'retailer', width: 25 },
        { key: 'price', width: 15 },
        { key: 'quantity', width: 12 },
        { key: 'total', width: 15 },
        { key: 'notes', width: 30 }
      ];

      pricingSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // ✅ NEW: PRICE COMPARISON SHEET
      const comparisonSheet = workbook.addWorksheet('Price Comparison');
      comparisonSheet.properties.defaultRowHeight = 20;

      comparisonSheet.mergeCells('A1:E1');
      const comparisonTitle = comparisonSheet.getCell('A1');
      comparisonTitle.value = 'PRICE COMPARISON BY ITEM';
      comparisonTitle.font = { size: 16, bold: true };
      comparisonTitle.alignment = { vertical: 'middle', horizontal: 'center' };

      const comparisonHeader = comparisonSheet.addRow([
        'Quotation No',
        'Item Name',
        'Retailer Name',
        'Unit Price',
        'Total Quoted'
      ]);

      comparisonHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      comparisonHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      quotations.forEach(quotation => {
        quotation.QuotationItems?.forEach(quotationItem => {
          const retailers = [];
          
          quotation.RetailerQuotations?.forEach(response => {
            const priceItem = response.RetailerQuotationItems?.find(
              ri => ri.quotation_item_id === quotationItem.quotation_item_id
            );
            
            if (priceItem) {
              retailers.push({
                name: response.RetailerDetails?.company_name || response.RetailerDetails?.User?.username || 'N/A',
                price: priceItem.unit_price || 0,
                total: (priceItem.unit_price || 0) * (priceItem.quantity || 0)
              });
            }
          });

          if (retailers.length > 0) {
            retailers.forEach(retailer => {
              comparisonSheet.addRow([
                quotation.quotation_number,
                quotationItem.Item?.item_name || 'N/A',
                retailer.name,
                retailer.price,
                retailer.total
              ]);
            });
            
            // Add separator
            comparisonSheet.addRow([]);
          }
        });
      });

      comparisonSheet.columns = [
        { key: 'quotation', width: 20 },
        { key: 'item', width: 35 },
        { key: 'retailer', width: 25 },
        { key: 'price', width: 15 },
        { key: 'total', width: 15 }
      ];

      comparisonSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // ===== SUMMARY STATISTICS =====
      summarySheet.addRow([]);
      summarySheet.addRow(['SUMMARY STATISTICS']);
      summarySheet.addRow(['Total Quotations:', quotations.length]);
      summarySheet.addRow(['Published:', quotations.filter(q => q.QuotationStatus?.status_name === 'published').length]);
      summarySheet.addRow(['Closed:', quotations.filter(q => q.QuotationStatus?.status_name === 'closed').length]);
      summarySheet.addRow(['Awarded:', quotations.filter(q => q.QuotationStatus?.status_name === 'awarded').length]);
      summarySheet.addRow(['Total Responses:', quotations.reduce((sum, q) => sum + (q.RetailerQuotations?.length || 0), 0)]);
      
      const totalQuotationValue = quotations.reduce((sum, q) => {
        return sum + q.RetailerQuotations?.reduce((rSum, r) => rSum + (r.total_amount || 0), 0);
      }, 0);
      summarySheet.addRow(['Total Quoted Value:', totalQuotationValue]);

      return workbook;
    } catch (error) {
      logger.error('Export quotations to Excel error:', error);
      throw error;
    }
  }

  // Helper method to format filter text
  getFilterText(filters) {
    const parts = [];
    if (filters.startDate) parts.push(`From: ${new Date(filters.startDate).toLocaleDateString()}`);
    if (filters.endDate) parts.push(`To: ${new Date(filters.endDate).toLocaleDateString()}`);
    if (parts.length === 0) parts.push('All Time');
    return `Report Period: ${parts.join(' - ')} | Generated on: ${new Date().toLocaleString()}`;
  }
}

export default new ReportService();