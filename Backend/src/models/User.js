import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import config from '../config/config.js';

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'user_type',
      key: 'type_id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'user_id'
    }
  },
  approved_on: {
    type: DataTypes.DATE
  },
  rejection_reason: {
    type: DataTypes.TEXT
  },
  first_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, config.bcrypt.rounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, config.bcrypt.rounds);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

export default User;