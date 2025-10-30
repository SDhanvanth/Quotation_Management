import sequelize from '../config/database.js';
import logger from '../config/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all seeders from seeders directory
import { seedUserTypes } from '../../seeders/01-userTypes.js';
import { seedQuotationStatus } from '../../seeders/02-quotationStatus.js';
import { seedEmailTemplates } from '../../seeders/03-emailTemplates.js';
import { seedCountries } from '../../seeders/04-countries.js';
import { seedStates } from '../../seeders/05-states.js';
import { seedDistricts } from '../../seeders/06-districts.js';
import { seedCategories } from '../../seeders/07-categories.js';
import { seedDemoData } from '../../seeders/08-demoData.js';
import { createNotificationsTable } from '../../seeders/09-notifications.js';

const runSeeders = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Run seeders in order
    await seedUserTypes();
    logger.info('✓ User types seeded');
    
    await seedQuotationStatus();
    logger.info('✓ Quotation statuses seeded');
    
    await seedEmailTemplates();
    logger.info('✓ Email templates seeded');
    
    await seedCountries();
    logger.info('✓ Countries seeded');
    
    await seedStates();
    logger.info('✓ States seeded');
    
    await seedDistricts();
    logger.info('✓ Districts seeded');
    
    await seedCategories();
    logger.info('✓ Categories seeded');
    
    await createNotificationsTable();
    logger.info('✓ Notifications table created');
    
    // Optional: Run demo data seeder
    if (process.env.NODE_ENV === 'development') {
      await seedDemoData();
      logger.info('✓ Demo data seeded');
    }
    
    logger.info('✅ Database seeding completed successfully');
  } catch (error) {
    logger.error('❌ Seeding error:', error);
    throw error;
  }
};

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runSeeders()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default runSeeders;