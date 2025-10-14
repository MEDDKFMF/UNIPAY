import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = 'https://unipay-oyn6.onrender.com';

// Create axios instance with default config
const sessionAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
sessionAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
sessionAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${access}`;
          return sessionAPI.request(error.config);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const sessionMonitoringService = {
  // Get real-time session data
  getRealTimeSessions: async () => {
    try {
      const response = await sessionAPI.get('/api/auth/admin/sessions/realtime/');
      return response.data;
    } catch (error) {
      logger.error('Error fetching real-time sessions:', error);
      throw error;
    }
  },

  // Get session metrics
  getSessionMetrics: async () => {
    try {
      const response = await sessionAPI.get('/api/auth/admin/sessions/metrics/');
      return response.data;
    } catch (error) {
      logger.error('Error fetching session metrics:', error);
      throw error;
    }
  },

  // Get paginated session list
  getSessions: async (params = {}) => {
    try {
      const response = await sessionAPI.get('/api/auth/admin/sessions/', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching sessions:', error);
      throw error;
    }
  },

  // Get session details
  getSessionDetails: async (sessionId) => {
    try {
      const response = await sessionAPI.get(`/api/auth/admin/sessions/${sessionId}/`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching session details:', error);
      throw error;
    }
  },

  // Terminate a session
  terminateSession: async (sessionId, reason = 'Terminated by admin') => {
    try {
      const response = await sessionAPI.post(`/api/auth/admin/sessions/terminate/${sessionId}/`, {
        reason
      });
      return response.data;
    } catch (error) {
      logger.error('Error terminating session:', error);
      throw error;
    }
  },

  // Bulk session actions
  bulkAction: async (sessionIds, action, reason = '') => {
    try {
      const response = await sessionAPI.post('/api/auth/admin/sessions/bulk-action/', {
        session_ids: sessionIds,
        action,
        reason
      });
      return response.data;
    } catch (error) {
      logger.error('Error performing bulk action:', error);
      throw error;
    }
  },

  // Get security alerts
  getSecurityAlerts: async (params = {}) => {
    try {
      const response = await sessionAPI.get('/api/auth/admin/security-alerts/', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching security alerts:', error);
      throw error;
    }
  },

  // Mark alert as read
  markAlertAsRead: async (alertId) => {
    try {
      const response = await sessionAPI.patch(`/security-alerts/${alertId}/read/`);
      return response.data;
    } catch (error) {
      logger.error('Error marking alert as read:', error);
      throw error;
    }
  }
};
