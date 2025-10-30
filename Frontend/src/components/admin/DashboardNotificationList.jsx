import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import notificationService from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';

const DashboardNotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications({
          page: 1,
          limit: 5 // Only show 5 most recent notifications
        });
        setNotifications(response.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(notification =>
        notification.notification_id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Notifications
        </h2>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Notifications
        </h2>
        <div className="text-center text-gray-500 py-4">
          No new notifications
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Notifications
        </h2>
        <a
          href="/admin/notifications"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          View all
        </a>
      </div>
      
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.notification_id}
            className={`p-3 rounded-lg transition-colors
              ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notification.created_on), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!notification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notification.notification_id)}
                  className="ml-2 flex-shrink-0 text-blue-500 hover:text-blue-600"
                  title="Mark as read"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardNotificationList;