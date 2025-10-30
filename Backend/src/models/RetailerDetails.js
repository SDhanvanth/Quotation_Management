import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RetailerDetails = sequelize.define('RetailerDetails', {
  retailer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  retailer_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  retailer_code: {
    type: DataTypes.STRING(50),
    unique: true
  },
  license_number: {
    type: DataTypes.STRING(100)
  },
  gst_number: {
    type: DataTypes.STRING(50)
  },
  pan_number: {
    type: DataTypes.STRING(50)
  },
  owner_name: {
    type: DataTypes.STRING(255)
  },
  owner_govt_id_type: {
    type: DataTypes.STRING(50)
  },
  owner_govt_id_number: {
    type: DataTypes.STRING(100)
  },
  phone_primary: {
    type: DataTypes.STRING(20)
  },
  phone_secondary: {
    type: DataTypes.STRING(20)
  },
  email_primary: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  email_secondary: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  bank_account_number: {
    type: DataTypes.STRING(50)
  },
  ifsc_code: {
    type: DataTypes.STRING(20)
  },
  website: {
    type: DataTypes.STRING(255)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'retailer_details'
});

export default RetailerDetails;