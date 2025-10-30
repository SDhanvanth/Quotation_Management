// models/RetailerQuotation.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RetailerQuotation = sequelize.define('RetailerQuotation', {
  retailer_quotation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'retailer_quotation_id'  // Explicitly specify the database column name
  },
  quotation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quotation',
      key: 'quotation_id'
    }
  },
  retailer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'retailer_details',
      key: 'retailer_id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'awarded', 'rejected'),
    defaultValue: 'draft',
    allowNull: false
  },
  submitted_on: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'retailer_quotation',
  timestamps: true,
  createdAt: 'created_on',
  updatedAt: 'updated_on',
  indexes: [
    {
      name: 'idx_retailer_quotation_quotation',
      fields: ['quotation_id']
    },
    {
      name: 'idx_retailer_quotation_retailer',
      fields: ['retailer_id']
    },
    {
      name: 'idx_retailer_quotation_status',
      fields: ['status']
    },
    {
      unique: true,
      name: 'unique_retailer_quotation',
      fields: ['quotation_id', 'retailer_id']  // Ensure one response per retailer per quotation
    }
  ]
});

// Remove any default 'id' field
RetailerQuotation.removeAttribute('id');

export default RetailerQuotation;