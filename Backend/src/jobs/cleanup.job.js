import cron from 'node-cron';
import otpService from '../services/otp.service.js';
import logger from '../config/logger.js';

// Run every hour
export const startCleanupJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running OTP cleanup job');
      await otpService.cleanupExpiredOTPs();
    } catch (error) {
      logger.error('OTP cleanup job failed:', error);
    }
  });
  
  logger.info('Cleanup jobs scheduled');
};