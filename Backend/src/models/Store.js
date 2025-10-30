// models/Store.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Store = sequelize.define('Store', {
  store_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  store_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  store_code: {
    type: DataTypes.STRING(50),
    unique: true
  },
  license_number: {
    type: DataTypes.STRING(100)
  },
  gst_number: {
    type: DataTypes.STRING(50)
  },
  pan_number: {
    type: DataTypes.STRING(50)
  },
  owner_name: {
    type: DataTypes.STRING(255)
  },
  phone_primary: {
    type: DataTypes.STRING(20)
  },
  phone_secondary: {
    type: DataTypes.STRING(20)
  },
  email_primary: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  email_secondary: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  website: {
    type: DataTypes.STRING(255)
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
  tableName: 'store',
  timestamps: true,
  createdAt: 'created_on',
  updatedAt: 'updated_on'
});

// Update the associations with unique aliases
Store.associate = (models) => {
  // Association for the store owner/user
  Store.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'storeUser' // Changed from 'user' to 'storeUser'
  });

  // Association for the creator
  Store.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  // Add any other associations
  Store.hasMany(models.Stock, {
    foreignKey: 'store_id',
    as: 'stocks'
  });

  Store.hasMany(models.StockRequest, {
    foreignKey: 'store_id',
    as: 'stockRequests'
  });
};

export default Store;