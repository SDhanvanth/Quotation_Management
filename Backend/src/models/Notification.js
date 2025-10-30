import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Notification = sequelize.define('Notification', {
  notification_id: {
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
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_on',
  updatedAt: false
});

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

export default Notification;