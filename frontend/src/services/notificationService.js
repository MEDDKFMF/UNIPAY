// Notification service for API calls
import api from './api';

// Get all notifications with optional filters
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/api/messaging/notifications/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get a single notification by ID
export const getNotification = async (id) => {
  try {
    const response = await api.get(`/api/messaging/notifications/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (id) => {
  try {
    const response = await api.patch(`/api/messaging/notifications/${id}/`, {
      is_read: true
    });
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.post('/api/messaging/notifications/mark-all-read/');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    await api.delete(`/api/messaging/notifications/${id}/`);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create notification (for testing or manual creation)
export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/api/messaging/notifications/', notificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notification preferences
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get('/api/messaging/notification-preferences/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await api.put('/api/messaging/notification-preferences/', preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Send test notification
export const sendTestNotification = async (type = 'system_update', data = {}) => {
  try {
    const response = await api.post('/api/messaging/send-test-notification/', {
      type,
      data,
      message: `Test ${type} notification`
    });
    return response.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

// Get notification statistics
export const getNotificationStats = async () => {
  try {
    const response = await api.get('/api/messaging/notification-stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

// Notification types and their default settings
export const NOTIFICATION_TYPES = {
  INVOICE_CREATED: 'invoice_created',
  INVOICE_PAID: 'invoice_paid',
  INVOICE_OVERDUE: 'invoice_overdue',
  PAYMENT_RECEIVED: 'payment_received',
  CLIENT_CREATED: 'client_created',
  SYSTEM_UPDATE: 'system_update',
  ERROR: 'error'
};

// Default notification preferences
export const DEFAULT_PREFERENCES = {
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  invoice_created: true,
  invoice_paid: true,
  invoice_overdue: true,
  payment_received: true,
  client_created: false,
  system_update: true,
  error: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
};
