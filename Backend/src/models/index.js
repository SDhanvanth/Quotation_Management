// models/index.js - UPDATED RetailerQuotationItem associations
import sequelize from '../config/database.js';
import User from './User.js';
import UserType from './UserType.js';
import Store from './Store.js';
import RetailerDetails from './RetailerDetails.js';
import Address from './Address.js';
import Item from './Item.js';
import Category from './Category.js';
import Quotation from './Quotation.js';
import QuotationItem from './QuotationItem.js';
import QuotationStatus from './QuotationStatus.js';
import StoreItemRequest from './StoreItemRequest.js';
import RetailerQuotation from './RetailerQuotation.js';
import RetailerQuotationItem from './RetailerQuotationItem.js';
import Stock from './Stock.js';
import StockRequest from './StockRequest.js';
import StockRequestItem from './StockRequestItem.js';
import UserActivityLog from './UserActivityLog.js';
import QuotationHistory from './QuotationHistory.js';
import Country from './Country.js';
import State from './State.js';
import District from './District.js';
import OTP from './OTP.js';
import EmailTemplate from './EmailTemplate.js';
import EmailLog from './EmailLog.js';
import Notification from './Notification.js';

// Define associations
const defineAssociations = () => {
  // ==================== User & UserType ====================
  User.belongsTo(UserType, { foreignKey: 'type_id' });
  UserType.hasMany(User, { foreignKey: 'type_id' });

  // ==================== Store ====================
  Store.belongsTo(User, { foreignKey: 'user_id', as: 'storeUser' });
  Store.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasOne(Store, { foreignKey: 'user_id' });
  User.hasMany(Store, { foreignKey: 'created_by', as: 'createdStores' });

  // ==================== Stock ====================
  Stock.belongsTo(Store, { foreignKey: 'store_id' });
  Stock.belongsTo(Item, { foreignKey: 'item_id' });
  Stock.belongsTo(User, { foreignKey: 'created_by', as: 'stockCreator' });
  
  Store.hasMany(Stock, { foreignKey: 'store_id' });
  Item.hasMany(Stock, { foreignKey: 'item_id' });
  User.hasMany(Stock, { foreignKey: 'created_by', as: 'createdStocks' });

  // ==================== Stock Request ====================
  StockRequest.belongsTo(Store, { foreignKey: 'store_id' });
  StockRequest.belongsTo(User, { foreignKey: 'created_by', as: 'requestCreator' });
  StockRequest.hasMany(StockRequestItem, { foreignKey: 'request_id' });
  
  Store.hasMany(StockRequest, { foreignKey: 'store_id' });
  User.hasMany(StockRequest, { foreignKey: 'created_by', as: 'createdRequests' });

  // ==================== Stock Request Item ====================
  StockRequestItem.belongsTo(StockRequest, { foreignKey: 'request_id' });
  StockRequestItem.belongsTo(Item, { foreignKey: 'item_id' });
  
  Item.hasMany(StockRequestItem, { foreignKey: 'item_id' });

  // ==================== Retailer Details ====================
  RetailerDetails.belongsTo(User, { foreignKey: 'user_id' });
  User.hasOne(RetailerDetails, { foreignKey: 'user_id' });

  // ==================== Address ====================
  Address.belongsTo(District, { foreignKey: 'district_id' });
  Address.belongsTo(State, { foreignKey: 'state_id' });
  Address.belongsTo(Country, { foreignKey: 'country_id' });
  
  District.hasMany(Address, { foreignKey: 'district_id' });
  State.hasMany(Address, { foreignKey: 'state_id' });
  Country.hasMany(Address, { foreignKey: 'country_id' });

  // ==================== Item & Category ====================
  Item.belongsTo(Category, { foreignKey: 'category_id' });
  Item.belongsTo(User, { foreignKey: 'created_by', as: 'itemCreator' });
  
  Category.hasMany(Item, { foreignKey: 'category_id' });
  User.hasMany(Item, { foreignKey: 'created_by', as: 'createdItems' });
  
  // Category self-referencing
  Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_category_id' });
  Category.hasMany(Category, { as: 'children', foreignKey: 'parent_category_id' });

  // ==================== Quotation ====================
  Quotation.belongsTo(QuotationStatus, { foreignKey: 'status_id' });
  Quotation.belongsTo(User, { foreignKey: 'created_by', as: 'quotationCreator' });
  Quotation.belongsTo(StockRequest, { foreignKey: 'stock_request_id' });
  Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id' });
  Quotation.hasMany(StoreItemRequest, { foreignKey: 'quotation_id' });
  Quotation.hasMany(RetailerQuotation, { foreignKey: 'quotation_id' });
  Quotation.hasMany(QuotationHistory, { foreignKey: 'quotation_id' });
  
  QuotationStatus.hasMany(Quotation, { foreignKey: 'status_id' });
  User.hasMany(Quotation, { foreignKey: 'created_by', as: 'createdQuotations' });
  StockRequest.hasMany(Quotation, { foreignKey: 'stock_request_id' });

  // ==================== QuotationItem ====================
  QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id' });
  QuotationItem.belongsTo(Item, { foreignKey: 'item_id' });
  QuotationItem.hasMany(RetailerQuotationItem, { foreignKey: 'quotation_item_id' });
  
  Item.hasMany(QuotationItem, { foreignKey: 'item_id' });

  // ==================== StoreItemRequest ====================
  StoreItemRequest.belongsTo(Store, { foreignKey: 'store_id' });
  StoreItemRequest.belongsTo(Quotation, { foreignKey: 'quotation_id' });
  StoreItemRequest.belongsTo(Item, { foreignKey: 'item_id' });
  StoreItemRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
  
  Store.hasMany(StoreItemRequest, { foreignKey: 'store_id' });
  Item.hasMany(StoreItemRequest, { foreignKey: 'item_id' });
  User.hasMany(StoreItemRequest, { foreignKey: 'approved_by', as: 'approvedRequests' });

  // ==================== RetailerQuotation ====================
  RetailerQuotation.belongsTo(Quotation, { foreignKey: 'quotation_id' });
  RetailerQuotation.belongsTo(RetailerDetails, { foreignKey: 'retailer_id' });
  
  // ✅ FIXED: Explicitly specify the sourceKey for RetailerQuotationItem association
  RetailerQuotation.hasMany(RetailerQuotationItem, { 
    foreignKey: 'retailer_quotation_id',
    sourceKey: 'retailer_quotation_id'  // Explicitly specify source key
  });
  
  RetailerDetails.hasMany(RetailerQuotation, { foreignKey: 'retailer_id' });

  // ==================== RetailerQuotationItem (✅ FIXED WITH EXPLICIT KEYS) ====================
  RetailerQuotationItem.belongsTo(RetailerQuotation, { 
    foreignKey: 'retailer_quotation_id',
    targetKey: 'retailer_quotation_id'  // Explicitly specify target key
  });
  
  RetailerQuotationItem.belongsTo(QuotationItem, { 
    foreignKey: 'quotation_item_id',
    targetKey: 'quotation_item_id'  // Explicitly specify target key
  });
  
  // Award system association with User
  RetailerQuotationItem.belongsTo(User, { 
    foreignKey: 'awarded_by', 
    as: 'awardedByUser',
    constraints: false
  });
  
  User.hasMany(RetailerQuotationItem, { 
    foreignKey: 'awarded_by', 
    as: 'awardedQuotationItems' 
  });

  // ==================== Location (Country, State, District) ====================
  State.belongsTo(Country, { foreignKey: 'country_id' });
  Country.hasMany(State, { foreignKey: 'country_id' });
  
  District.belongsTo(State, { foreignKey: 'state_id' });
  State.hasMany(District, { foreignKey: 'state_id' });

  // ==================== User Activity Log ====================
  UserActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'activityUser' });
  User.hasMany(UserActivityLog, { foreignKey: 'user_id', as: 'activities' });

  // ==================== Quotation History ====================
  QuotationHistory.belongsTo(Quotation, { foreignKey: 'quotation_id' });
  QuotationHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'historyUser' });
  
  User.hasMany(QuotationHistory, { foreignKey: 'changed_by', as: 'quotationHistories' });

  // ==================== OTP ====================
  OTP.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(OTP, { foreignKey: 'user_id' });
  
  // ==================== Email Log ====================
  EmailLog.belongsTo(User, { foreignKey: 'user_id', as: 'emailUser' });
  User.hasMany(EmailLog, { foreignKey: 'user_id', as: 'emailLogs' });

  // ==================== Notification ====================
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'notificationUser' });
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
};

// Execute associations
defineAssociations();

// Export all models
export {
  sequelize,
  User,
  UserType,
  Store,
  RetailerDetails,
  Address,
  Item,
  Category,
  Quotation,
  QuotationItem,
  QuotationStatus,
  StoreItemRequest,
  RetailerQuotation,
  RetailerQuotationItem,
  Stock,
  StockRequest,
  StockRequestItem,
  UserActivityLog,
  QuotationHistory,
  Country,
  State,
  District,
  OTP,
  EmailTemplate,
  EmailLog,
  Notification
};

export default sequelize;