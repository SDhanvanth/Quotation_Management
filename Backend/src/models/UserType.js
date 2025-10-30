import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserType = sequelize.define('UserType', {
  type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  type_description: {
    type: DataTypes.STRING(255)
  },
  permissions: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'user_type',
  timestamps: false
});

export default UserType;