import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import crypto from 'crypto';

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  token_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  used_at: {
    type: DataTypes.DATE
  },
  ip_address: {
    type: DataTypes.STRING(45)
  }
}, {
  tableName: 'password_reset_token',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Generate secure random token
PasswordResetToken.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if token is expired
PasswordResetToken.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

export default PasswordResetToken;