import Notification from '../models/Notification.js';
import User from '../models/User.js';
import UserType from '../models/UserType.js';

export const createNotification = async (params) => {
  const { user_id, type, title, message, data } = params;
  return await Notification.create({
    user_id,
    type,
    title,
    message,
    data
  });
};

export const getAdminNotifications = async (params = {}) => {
  const { page = 1, limit = 10, is_read } = params;
  
  // Find admin users
  const adminType = await UserType.findOne({ where: { type_name: 'admin' } });
  const adminUsers = await User.findAll({ where: { type_id: adminType.type_id } });
  const adminIds = adminUsers.map(admin => admin.user_id);

  const where = { user_id: adminIds };
  if (typeof is_read === 'boolean') {
    where.is_read = is_read;
  }

  const { count, rows } = await Notification.findAndCountAll({
    where,
    include: [{
      model: User,
      attributes: ['username', 'email']
    }],
    order: [['created_on', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  });

  return {
    notifications: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit))
  };
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  if (notification.user_id !== userId) {
    throw new Error('Unauthorized to update this notification');
  }
  
  notification.is_read = true;
  await notification.save();
  
  return notification;
};

export const markAllNotificationsAsRead = async (userId) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
  
  return { success: true };
};

export const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: { user_id: userId, is_read: false }
  });
  
  return { count };
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  if (notification.user_id !== userId) {
    throw new Error('Unauthorized to delete this notification');
  }
  
  await notification.destroy();
  
  return { success: true };
};

export default {
  createNotification,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification
};