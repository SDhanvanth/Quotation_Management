import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuotationStatus = sequelize.define('QuotationStatus', {
  status_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status_name: {
    type: DataTypes.STRING(50),
    unique: true
  },
  status_description: {
    type: DataTypes.STRING(255)
  },
  status_order: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'quotation_status',
  timestamps: false
});

export default QuotationStatus;