import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Country = sequelize.define('Country', {
  country_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  country_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country_code: {
    type: DataTypes.STRING(3)
  }
}, {
  tableName: 'country',
  timestamps: false
});

export default Country;