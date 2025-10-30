import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OTP = sequelize.define('OTP', {
  otp_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  otp_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['registration', 'login', 'password_reset', 'email_verification']]
    }
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ip_address: {
    type: DataTypes.STRING(45)
  }
}, {
  tableName: 'otp',
  indexes: [
    {
      fields: ['email', 'otp_type', 'is_used']
    },
    {
      fields: ['expires_at']
    }
  ]
});

export default OTP;