import userService from '../services/user.service.js';
import notificationService from '../services/notification.service.js';
import emailService from '../services/email.service.js';
import { UserActivityLog } from '../models/index.js';

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type_id, search } = req.query;
    const users = await userService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      type_id,
      search
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'UPDATE_USER',
      activity_description: `Updated user ${req.params.id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'DELETE_USER',
      activity_description: `Deleted user ${req.params.id}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getUserProfile(req.user.user_id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await userService.updateUserProfile(req.user.user_id, req.body);
    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
};

export const approveUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { storeData } = req.body;
    const adminId = req.user.user_id;

    // First get user details to check type
    const userCheck = await userService.getUserById(userId);
    if (userCheck.UserType?.type_name?.toLowerCase() === 'store' && !storeData) {
      return res.status(400).json({ 
        error: 'Store details are required for store type users. Please provide store details.' 
      });
    }

    const user = await userService.approveUser(userId, adminId, storeData);

    // Create activity log
    await UserActivityLog.create({
      user_id: adminId,
      activity_type: 'USER_APPROVAL',
      activity_description: `Approved user ${user.username}${storeData ? ' and created store' : ''}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Send notification to user
    await notificationService.createNotification({
      user_id: userId,
      type: 'ACCOUNT_APPROVED',
      title: 'Account Approved',
      message: `Your account has been approved${storeData ? ' and your store has been created' : ''}. You can now login to access the system.`,
      data: {
        approved_by: adminId,
        approved_on: user.approved_on,
        store_id: user.Store ? user.Store.store_id : null
      }
    });

    // Send email to user
    await emailService.sendAccountApprovalEmail(user);

    res.json({ 
      message: `User approved successfully${storeData ? ' and store created' : ''}`, 
      user 
    });
  } catch (error) {
    next(error);
  }
};

export const rejectUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.user_id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const user = await userService.rejectUser(userId, reason, adminId);

    // Create activity log
    await UserActivityLog.create({
      user_id: adminId,
      activity_type: 'USER_REJECTION',
      activity_description: `Rejected user ${user.username}. Reason: ${reason}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Send notification to user
    await notificationService.createNotification({
      user_id: userId,
      type: 'ACCOUNT_REJECTED',
      title: 'Account Rejected',
      message: 'Your account registration has been rejected.',
      data: {
        rejected_by: adminId,
        rejected_on: user.approved_on,
        reason
      }
    });

    // Send email to user
    await emailService.sendAccountRejectionEmail(user, reason);

    res.json({ message: 'User rejected successfully', user });
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  approveUser,
  rejectUser
};