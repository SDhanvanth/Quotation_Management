import React, { useEffect, useState, useRef } from 'react';
import notificationService from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { notifications: notifs } = await notificationService.getNotifications({
        limit: 5,
        is_read: false
      });
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      await fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none relative"
        onClick={handleBellClick}
      >
        <svg 
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 w-80 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.notification_id}
                  onClick={() => handleMarkAsRead(notification.notification_id)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800 mb-1">
                    {notification.title}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.created_on), { addSuffix: true })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 text-center">
            <Link 
              to="/admin/notifications" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;