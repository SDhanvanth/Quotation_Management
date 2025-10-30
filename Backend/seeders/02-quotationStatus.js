import { QuotationStatus } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedQuotationStatus = async () => {
  try {
    const statuses = [
      {
        status_name: 'draft',
        status_description: 'Quotation is being prepared',
        status_order: 1
      },
      {
        status_name: 'published',
        status_description: 'Quotation is open for responses',
        status_order: 2
      },
      {
        status_name: 'closed',
        status_description: 'Quotation is closed for new responses',
        status_order: 3
      },
      {
        status_name: 'awarded',
        status_description: 'Quotation has been awarded to a retailer',
        status_order: 4
      },
      {
        status_name: 'cancelled',
        status_description: 'Quotation has been cancelled',
        status_order: 5
      }
    ];

    for (const status of statuses) {
      await QuotationStatus.findOrCreate({
        where: { status_name: status.status_name },
        defaults: status
      });
    }

    logger.info('Quotation statuses seeded successfully');
  } catch (error) {
    logger.error('Error seeding quotation statuses:', error);
    throw error;
  }
};