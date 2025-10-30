import app from './src/app.js';
import config from './src/config/config.js';
import { connectDB } from './src/config/database.js';
import logger from './src/config/logger.js';
import { startCleanupJobs } from './src/jobs/cleanup.job.js';
import runSeeders from './src/utils/runSeeders.js';
import initDatabase from './src/config/initDatabase.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    await import('./src/models/index.js');
    logger.info('Model associations loaded');

    startCleanupJobs();
    await initDatabase(true);


    if (process.env.NODE_ENV === 'development' && process.env.RUN_SEEDERS === 'true') {
      await runSeeders();
    }
    
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();