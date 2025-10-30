import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        page,
        limit: 10
      });
      setNotifications(response.notifications);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
        <button
          onClick={handleMarkAllAsRead}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Mark all as read
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`p-4 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {notification.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.created_on), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="ml-4 flex space-x-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.notification_id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <span className="sr-only">Mark as read</span>
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
                  <button
                    onClick={() => handleDelete(notification.notification_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <span className="sr-only">Delete</span>
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No notifications found</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;