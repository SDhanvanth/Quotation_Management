// models/StockRequest.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StockRequest = sequelize.define('StockRequest', {
  request_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'store',
      key: 'store_id'
    }
  },
  request_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'quoted', 'completed'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  approval_date: {
    type: DataTypes.DATE
  },
  approval_notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'stock_request',
  timestamps: true,
  createdAt: 'created_on',
  updatedAt: 'updated_on'
});

export default StockRequest;