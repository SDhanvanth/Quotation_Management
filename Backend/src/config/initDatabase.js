// src/config/initDatabase.js (COMPLETE FIXED VERSION)
import sequelize from '../config/database.js';
import logger from '../config/logger.js';
import '../models/index.js'; // imports models & sets associations

const initDatabase = async (force = false) => {
  try {
    logger.info('🔄 Synchronizing database...');
    
    if (force) {
      logger.warn('⚠️  FORCE SYNC ENABLED - All data will be lost!');
      
      // ✅ THIS IS THE FIX - ADD THIS BEFORE sync()
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
      logger.info('🔓 Foreign key checks disabled');
      
      try {
        // Now Sequelize can drop ALL tables without foreign key errors
        await sequelize.sync({ force: true });
        logger.info('✅ All tables dropped and recreated successfully');
        
      } finally {
        // ✅ Re-enable foreign key checks after all operations
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        logger.info('🔒 Foreign key checks re-enabled');
      }
      
    } else {
      // Safe mode - only alters existing tables
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synchronized successfully (alter mode)');
    }

  } catch (error) {
    logger.error('❌ Database sync error:', error);
    
    // Always try to re-enable foreign key checks on error
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
    } catch (resetError) {
      logger.error('Failed to reset foreign key checks:', resetError);
    }
    
    throw error;
  }
};

export default initDatabase;