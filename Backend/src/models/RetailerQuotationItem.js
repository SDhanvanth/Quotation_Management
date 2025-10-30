// models/RetailerQuotationItem.js - UPDATED
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RetailerQuotationItem = sequelize.define('RetailerQuotationItem', {
  retailer_quotation_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'retailer_quotation_item_id'  // Explicitly specify the column name
  },
  retailer_quotation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'retailer_quotation',
      key: 'retailer_quotation_id'
    }
  },
  quotation_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quotation_item',
      key: 'quotation_item_id'
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_awarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  awarded_on: {
    type: DataTypes.DATE,
    allowNull: true
  },
  awarded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'user_id'
    }
  }
}, {
  tableName: 'retailer_quotation_item',
  timestamps: false,
  // Tell Sequelize not to add the default 'id' field
  id: false
});

// Remove the default id attribute that Sequelize adds
RetailerQuotationItem.removeAttribute('id');

export default RetailerQuotationItem;