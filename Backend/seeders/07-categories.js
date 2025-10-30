import { Category } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedCategories = async () => {
  try {
    const categories = [
      {
        category_name: 'Electronics',
        category_description: 'Electronic items and accessories',
        parent_category_id: null,
        is_active: true
      },
      {
        category_name: 'Office Supplies',
        category_description: 'Stationery and office equipment',
        parent_category_id: null,
        is_active: true
      },
      {
        category_name: 'Furniture',
        category_description: 'Office and home furniture',
        parent_category_id: null,
        is_active: true
      },
      {
        category_name: 'Hardware',
        category_description: 'Computer hardware and peripherals',
        parent_category_id: null,
        is_active: true
      },
      {
        category_name: 'Software',
        category_description: 'Software licenses and subscriptions',
        parent_category_id: null,
        is_active: true
      }
    ];

    for (const category of categories) {
      await Category.findOrCreate({
        where: { category_name: category.category_name },
        defaults: category
      });
    }

    logger.info('Categories seeded successfully');
  } catch (error) {
    logger.error('Error seeding categories:', error);
    throw error;
  }
};