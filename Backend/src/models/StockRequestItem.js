// models/StockRequestItem.js - ADD is_quoted FIELD
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StockRequestItem = sequelize.define('StockRequestItem', {
  request_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stock_request',
      key: 'request_id'
    }
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'item',
      key: 'item_id'
    }
  },
  quantity_requested: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  quantity_approved: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  // ✅ ADD THIS FIELD
  is_quoted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'stock_request_item',
  timestamps: true,
  createdAt: 'created_on',
  updatedAt: 'updated_on'
});

export default StockRequestItem;