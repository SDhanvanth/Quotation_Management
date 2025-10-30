import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const State = sequelize.define('State', {
  state_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  state_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state_code: {
    type: DataTypes.STRING(10)
  },
  country_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'country',
      key: 'country_id'
    }
  }
}, {
  tableName: 'state',
  timestamps: false
});

export default State;