import emailService from '../services/email.service.js';
import notificationService from '../services/notification.service.js';

export const getEmailLogs = async (req, res, next) => {
  try {
    const logs = await emailService.getEmailLogs(req.query);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const sendTestEmail = async (req, res, next) => {
  try {
    const { to, template } = req.body;
    
    await emailService.sendEmail({
      to,
      subject: 'Test Email',
      html: '<h1>This is a test email</h1>',
      text: 'This is a test email'
    });
    
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getAdminNotifications(req.query);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsRead(
      req.params.id,
      req.user.user_id
    );
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.user_id);
    res.json(count);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(
      req.params.id,
      req.user.user_id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getEmailLogs,
  sendTestEmail,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};