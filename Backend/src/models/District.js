import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const District = sequelize.define('District', {
  district_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  district_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'state',
      key: 'state_id'
    }
  }
}, {
  tableName: 'district',
  timestamps: false
});

export default District;