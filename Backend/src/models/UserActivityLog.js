import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserActivityLog = sequelize.define('UserActivityLog', {
  log_id: {
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
  activity_type: {
    type: DataTypes.STRING(100)
  },
  activity_description: {
    type: DataTypes.TEXT
  },
  ip_address: {
    type: DataTypes.STRING(45)
  },
  user_agent: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'user_activity_log',
  updatedAt: false
});

export default UserActivityLog;