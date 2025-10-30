import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  template_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  template_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  template_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  body_html: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  body_text: {
    type: DataTypes.TEXT
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'email_template'
});

export default EmailTemplate;