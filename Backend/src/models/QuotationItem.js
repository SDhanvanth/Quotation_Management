import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuotationItem = sequelize.define('QuotationItem', {
  quotation_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  unit_of_measure: {
    type: DataTypes.STRING(50)
  },
  specifications: {
    type: DataTypes.TEXT
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'quotation_item',
  updatedAt: false,
  // ✅ ADDED: Indexes on foreign keys for faster JOINs
  indexes: [
    {
      name: 'idx_quotation_item_quotation_id',
      fields: ['quotation_id']
    },
    {
      name: 'idx_quotation_item_item_id',
      fields: ['item_id']
    }
  ]
});

export default QuotationItem;