import { State, Country } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedStates = async () => {
  try {
    // Get India's country_id
    const india = await Country.findOne({ where: { country_code: 'IN' } });
    
    if (!india) {
      throw new Error('Country India not found. Please run country seeder first.');
    }

    const states = [
      { state_name: 'Andhra Pradesh', state_code: 'AP', country_id: india.country_id },
      { state_name: 'Karnataka', state_code: 'KA', country_id: india.country_id },
      { state_name: 'Tamil Nadu', state_code: 'TN', country_id: india.country_id },
      { state_name: 'Maharashtra', state_code: 'MH', country_id: india.country_id },
      { state_name: 'Delhi', state_code: 'DL', country_id: india.country_id },
      { state_name: 'Gujarat', state_code: 'GJ', country_id: india.country_id },
      { state_name: 'Rajasthan', state_code: 'RJ', country_id: india.country_id },
      { state_name: 'Uttar Pradesh', state_code: 'UP', country_id: india.country_id },
      { state_name: 'West Bengal', state_code: 'WB', country_id: india.country_id },
      { state_name: 'Kerala', state_code: 'KL', country_id: india.country_id }
    ];

    for (const state of states) {
      await State.findOrCreate({
        where: { state_code: state.state_code },
        defaults: state
      });
    }

    logger.info('States seeded successfully');
  } catch (error) {
    logger.error('Error seeding states:', error);
    throw error;
  }
};