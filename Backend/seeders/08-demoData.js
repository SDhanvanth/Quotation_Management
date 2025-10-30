import bcrypt from 'bcryptjs';
import { User, UserType, Store, RetailerDetails } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedDemoData = async () => {
  try {
    // Create password hash directly
    const hashedPassword = '$2a$10$YourHashedPasswordHere'; // This will be replaced
    const actualHashedPassword = await bcrypt.hash('password123', 10);
    
    // Get user types
    const adminType = await UserType.findOne({ where: { type_name: 'admin' } });
    const storeType = await UserType.findOne({ where: { type_name: 'store' } });
    const retailerType = await UserType.findOne({ where: { type_name: 'retailer' } });
    
    // Create admin user (admin is auto-approved and firstLogin is false)
    const [adminUser] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: actualHashedPassword,
        email: 'dhanvanth711@gmail.com',
        type_id: adminType.type_id,
        is_active: true,
        is_approved: true, // Admin is auto-approved
        email_verified: true,
        first_login: false // Admin doesn't need first login setup
      }
    });
    
    // Create store user (needs approval, firstLogin will be true until they set up store)
    const [storeUser] = await User.findOrCreate({
      where: { username: 'store1' },
      defaults: {
        username: 'store1',
        password: actualHashedPassword,
        email: 'store1@quotemaster.com',
        type_id: storeType.type_id,
        is_active: true,
        is_approved: true, // Pre-approved for demo
        approved_by: adminUser.user_id,
        approved_on: new Date(),
        email_verified: true,
        first_login: false // Set to false since we're creating store details below
      }
    });
    
    // Create store details
    await Store.findOrCreate({
      where: { user_id: storeUser.user_id },
      defaults: {
        user_id: storeUser.user_id,
        store_name: 'Demo Store 1',
        store_code: 'STR-00001',
        owner_name: 'John Doe',
        phone_primary: '9876543210',
        email_primary: 'store1@quotemaster.com',
        is_active: true,
        created_by: adminUser.user_id
      }
    });
    
    // Create retailer user (needs approval, firstLogin will be true until they set up details)
    const [retailerUser] = await User.findOrCreate({
      where: { username: 'retailer1' },
      defaults: {
        username: 'retailer1',
        password: actualHashedPassword,
        email: 'retailer1@quotemaster.com',
        type_id: retailerType.type_id,
        is_active: true,
        is_approved: true, // Pre-approved for demo
        approved_by: adminUser.user_id,
        approved_on: new Date(),
        email_verified: true,
        first_login: false // Set to false since we're creating retailer details below
      }
    });
    
    // Create retailer details
    await RetailerDetails.findOrCreate({
      where: { user_id: retailerUser.user_id },
      defaults: {
        user_id: retailerUser.user_id,
        retailer_name: 'Demo Retailer 1',
        retailer_code: 'RET-00001',
        owner_name: 'Jane Smith',
        phone_primary: '9876543211',
        email_primary: 'retailer1@quotemaster.com',
        gst_number: '29ABCDE1234F1Z5',
        pan_number: 'ABCDE1234F',
        is_active: true
      }
    });

    // Create unapproved users for testing (they will have firstLogin = true by default)
    const [unapprovedStore] = await User.findOrCreate({
      where: { username: 'store2' },
      defaults: {
        username: 'store2',
        password: actualHashedPassword,
        email: 'store2@quotemaster.com',
        type_id: storeType.type_id,
        is_active: true,
        is_approved: false, // Not approved
        email_verified: true,
        first_login: true // Will remain true until they complete setup
      }
    });

    const [unapprovedRetailer] = await User.findOrCreate({
      where: { username: 'retailer2' },
      defaults: {
        username: 'retailer2',
        password: actualHashedPassword,
        email: 'retailer2@quotemaster.com',
        type_id: retailerType.type_id,
        is_active: true,
        is_approved: false, // Not approved
        email_verified: true,
        first_login: true // Will remain true until they complete setup
      }
    });

    logger.info('Demo data seeded successfully');
    logger.info('Demo credentials:');
    logger.info('Admin - username: admin, password: password123 (firstLogin: false)');
    logger.info('Store (approved) - username: store1, password: password123 (firstLogin: false)');
    logger.info('Retailer (approved) - username: retailer1, password: password123 (firstLogin: false)');
    logger.info('Store (unapproved) - username: store2, password: password123 (firstLogin: true)');
    logger.info('Retailer (unapproved) - username: retailer2, password: password123 (firstLogin: true)');
  } catch (error) {
    logger.error('Error seeding demo data:', error);
    throw error;
  }
};