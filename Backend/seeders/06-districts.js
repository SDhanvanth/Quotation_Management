import { District, State } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedDistricts = async () => {
  try {
    // Get all states
    const states = await State.findAll();
    const stateMap = {};
    
    states.forEach(state => {
      stateMap[state.state_code] = state.state_id;
    });

    const districts = [
      // Karnataka districts
      { district_name: 'Bangalore Urban', state_id: stateMap['KA'] },
      { district_name: 'Bangalore Rural', state_id: stateMap['KA'] },
      { district_name: 'Mysore', state_id: stateMap['KA'] },
      { district_name: 'Mangalore', state_id: stateMap['KA'] },
      
      // Tamil Nadu districts
      { district_name: 'Chennai', state_id: stateMap['TN'] },
      { district_name: 'Coimbatore', state_id: stateMap['TN'] },
      { district_name: 'Madurai', state_id: stateMap['TN'] },
      
      // Maharashtra districts
      { district_name: 'Mumbai', state_id: stateMap['MH'] },
      { district_name: 'Pune', state_id: stateMap['MH'] },
      { district_name: 'Nagpur', state_id: stateMap['MH'] },
      
      // Delhi districts
      { district_name: 'New Delhi', state_id: stateMap['DL'] },
      { district_name: 'Central Delhi', state_id: stateMap['DL'] },
      
      // Add more districts as needed
    ];

    for (const district of districts) {
      if (district.state_id) {
        await District.findOrCreate({
          where: { 
            district_name: district.district_name,
            state_id: district.state_id 
          },
          defaults: district
        });
      }
    }

    logger.info('Districts seeded successfully');
  } catch (error) {
    logger.error('Error seeding districts:', error);
    throw error;
  }
};