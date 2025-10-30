import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailLog = sequelize.define('EmailLog', {
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
  email_to: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email_from: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  template_used: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'sent', 'failed', 'bounced']]
    }
  },
  error_message: {
    type: DataTypes.TEXT
  },
  sent_at: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'email_log'
});

export default EmailLog;