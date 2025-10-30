import { UserType } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedUserTypes = async () => {
  try {
    const userTypes = [
      {
        type_name: 'admin',
        type_description: 'System Administrator',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          stores: ['create', 'read', 'update', 'delete'],
          retailers: ['create', 'read', 'update', 'delete'],
          quotations: ['create', 'read', 'update', 'delete', 'award'],
          items: ['create', 'read', 'update', 'delete'],
          stock: ['create', 'read', 'update', 'delete', 'transfer'],
          reports: ['view', 'export'],
          settings: ['manage']
        })
      },
      {
        type_name: 'store',
        type_description: 'Store Manager',
        permissions: JSON.stringify({
          quotations: ['create', 'read', 'update'],
          items: ['read', 'request'],
          stock: ['read', 'update'],
          reports: ['view'],
          profile: ['read', 'update']
        })
      },
      {
        type_name: 'retailer',
        type_description: 'Retailer/Supplier',
        permissions: JSON.stringify({
          quotations: ['read', 'respond'],
          items: ['read'],
          profile: ['read', 'update'],
          responses: ['create', 'read', 'update']
        })
      }
    ];

    for (const userType of userTypes) {
      await UserType.findOrCreate({
        where: { type_name: userType.type_name },
        defaults: userType
      });
    }

    logger.info('User types seeded successfully');
  } catch (error) {
    logger.error('Error seeding user types:', error);
    throw error;
  }
};