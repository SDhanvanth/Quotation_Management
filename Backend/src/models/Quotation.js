// models/Quotation.js - ADD THIS FIELD
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Quotation = sequelize.define('Quotation', {
  quotation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quotation_number: {
    type: DataTypes.STRING(50),
    unique: true
  },
  quotation_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  quotation_type: {
    type: DataTypes.STRING(50)
  },
  status_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'quotation_status',
      key: 'status_id'
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  // ✅ ADD THIS FIELD
  stock_request_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stock_request',
      key: 'request_id'
    }
  },
  validity_from: {
    type: DataTypes.DATE
  },
  validity_until: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'quotation',
  timestamps: true,
  createdAt: 'created_on',
  updatedAt: 'updated_on',
  indexes: [
    {
      name: 'idx_quotation_status',
      fields: ['status_id']
    },
    {
      name: 'idx_quotation_created_by',
      fields: ['created_by']
    },
    {
      name: 'idx_quotation_validity',
      fields: ['validity_until']
    },
    {
      name: 'idx_quotation_stock_request',
      fields: ['stock_request_id']
    }
  ]
});

export default Quotation;