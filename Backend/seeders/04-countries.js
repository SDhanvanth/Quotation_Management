import { Country } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedCountries = async () => {
  try {
    const countries = [
      { country_name: 'India', country_code: 'IN' }
    ];

    for (const country of countries) {
      await Country.findOrCreate({
        where: { country_code: country.country_code },
        defaults: country
      });
    }

    logger.info('Countries seeded successfully');
  } catch (error) {
    logger.error('Error seeding countries:', error);
    throw error;
  }
};