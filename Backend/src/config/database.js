import { Sequelize } from 'sequelize';
import config from './config.js';
import logger from './logger.js';

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    pool: config.database.pool,
    logging: config.database.logging,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_on',
      updatedAt: 'updated_on'
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true });
    //   logger.info('Database synchronized');
    // }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;