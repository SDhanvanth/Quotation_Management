import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Item = sequelize.define('Item', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item_code: {
    type: DataTypes.STRING(50),
    unique: true
  },
  item_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  item_description: {
    type: DataTypes.TEXT
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'category',
      key: 'category_id'
    }
  },
  unit_of_measure: {
    type: DataTypes.STRING(50)
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  }
}, {
  tableName: 'item'
});

export default Item;