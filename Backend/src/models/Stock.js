import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Stock = sequelize.define('Stock', {
  stock_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'store',
      key: 'store_id'
    }
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'item',
      key: 'item_id'
    }
  },
  current_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  reserved_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  available_stock: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.current_stock - this.reserved_stock;
    }
  },
  min_stock_level: {
    type: DataTypes.DECIMAL(10, 2)
  },
  max_stock_level: {
    type: DataTypes.DECIMAL(10, 2)
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stock',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'item_id']
    }
  ]
});

export default Stock;