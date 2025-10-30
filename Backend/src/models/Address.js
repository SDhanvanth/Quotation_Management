import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Address = sequelize.define('Address', {
  address_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['store', 'retailer']]
    }
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  address_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['primary', 'billing', 'shipping']]
    }
  },
  door_number: {
    type: DataTypes.STRING(50)
  },
  street_address: {
    type: DataTypes.STRING(255)
  },
  landmark: {
    type: DataTypes.STRING(255)
  },
  city: {
    type: DataTypes.STRING(100)
  },
  district_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'district',
      key: 'district_id'
    }
  },
  state_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'state',
      key: 'state_id'
    }
  },
  country_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'country',
      key: 'country_id'
    }
  },
  pincode: {
    type: DataTypes.STRING(20)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'address',
  updatedAt: false
});

export default Address;