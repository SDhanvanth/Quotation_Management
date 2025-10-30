import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StoreItemRequest = sequelize.define('StoreItemRequest', {
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
  quotation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quotation',
      key: 'quotation_id'
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
  requested_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  justification: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    }
  },
  requested_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  approved_on: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'store_item_request',
  timestamps: false
});

export default StoreItemRequest;