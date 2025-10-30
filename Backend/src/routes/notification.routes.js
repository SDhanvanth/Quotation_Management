import express from 'express';
import { query } from 'express-validator';
import notificationController from '../controllers/notification.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Email logs routes
router.get('/email-logs',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'sent', 'failed', 'bounced']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  notificationController.getEmailLogs
);

router.post('/test-email',
  authenticate,
  authorize('admin'),
  notificationController.sendTestEmail
);

// Notification routes
router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('is_read').optional().isBoolean()
  ],
  validate,
  notificationController.getNotifications
);

router.get('/unread-count',
  authenticate,
  authorize('admin'),
  notificationController.getUnreadCount
);

router.patch('/mark-all-read',
  authenticate,
  authorize('admin'),
  notificationController.markAllAsRead
);

router.patch('/:id/read',
  authenticate,
  authorize('admin'),
  notificationController.markAsRead
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  notificationController.deleteNotification
);

export default router;