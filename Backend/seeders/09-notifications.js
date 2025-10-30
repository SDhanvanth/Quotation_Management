import { DataTypes } from 'sequelize';
import sequelize from '../src/config/database.js';

export const createNotificationsTable = async () => {
  try {
    await sequelize.getQueryInterface().createTable('notifications', {
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
    });

    console.log('Notifications table created successfully');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }
};

export default createNotificationsTable;