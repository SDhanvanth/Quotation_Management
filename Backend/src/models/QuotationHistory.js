import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuotationHistory = sequelize.define('QuotationHistory', {
  history_id: {
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
  action: {
    type: DataTypes.STRING(100)
  },
  old_value: {
    type: DataTypes.JSON
  },
  new_value: {
    type: DataTypes.JSON
  },
  changed_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  changed_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quotation_history',
  timestamps: false
});

export default QuotationHistory;