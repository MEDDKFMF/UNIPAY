import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/messaging/notifications/');
      const notificationData = response.data.results || response.data;
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/api/messaging/notifications/${notificationId}/`, {
        is_read: true
      });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/messaging/notifications/mark-all-read/');
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/messaging/notifications/${notificationId}/`);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = 'info', options = {}) => {
    const toastOptions = {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      ...options
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
      case 'info':
      default:
        toast(message, toastOptions);
        break;
    }
  }, []);

  // Notification types and their handlers
  const notificationHandlers = {
    invoice_created: (data) => {
      showToast(`New invoice #${data.invoice_number} created for ${data.client_name}`, 'success');
    },
    invoice_paid: (data) => {
      showToast(`Invoice #${data.invoice_number} has been paid by ${data.client_name}`, 'success');
    },
    invoice_overdue: (data) => {
      showToast(`Invoice #${data.invoice_number} is now overdue`, 'warning');
    },
    payment_received: (data) => {
      showToast(`Payment of ${data.amount} received for invoice #${data.invoice_number}`, 'success');
    },
    client_created: (data) => {
      showToast(`New client ${data.client_name} added to your account`, 'info');
    },
    system_update: (data) => {
      showToast(data.message, 'info');
    },
    error: (data) => {
      showToast(data.message, 'error');
    }
  };

  // Handle incoming notification
  const handleNotification = useCallback((notification) => {
    addNotification(notification);
    
    // Show toast if notification has a handler
    if (notificationHandlers[notification.type]) {
      notificationHandlers[notification.type](notification.data);
    }
  }, [addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up polling for new notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    showToast,
    handleNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
