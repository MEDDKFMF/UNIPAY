import axios from 'axios';
import logger from '../utils/logger';

// Fixed API base URL (avoid env to prevent redeploys changing URLs)
const resolveBaseURL = () => 'https://unipay-oyn6.onrender.com';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/api/auth/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          // No refresh token, clear tokens and let AuthContext handle redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (refreshError) {
        logger.error('Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and let AuthContext handle redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  logout: () => api.post('/api/auth/logout/'),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (profileData) => api.put('/api/auth/profile/update/', profileData),
  refreshToken: (refresh) => api.post('/api/auth/refresh/', { refresh }),
  getStats: () => api.get('/api/auth/stats/'),
};

// Invoice API
export const invoiceAPI = {
  getInvoices: (params = {}) => api.get('/api/invoices/', { params }),
  getInvoice: (id) => api.get(`/api/invoices/${id}/`),
  createInvoice: (invoiceData) => api.post('/api/invoices/', invoiceData),
  updateInvoice: (id, invoiceData) => api.put(`/api/invoices/${id}/`, invoiceData),
  deleteInvoice: (id) => api.delete(`/api/invoices/${id}/`),
  updateStatus: (id, status) => api.patch(`/api/invoices/${id}/status/`, { status }),
  getPDF: (id) => api.get(`/api/invoices/${id}/pdf/`, { responseType: 'blob' }),
  getStats: () => api.get('/api/invoices/stats/'),
  exportCSV: (params = {}) => api.get('/api/invoices/export/', { 
    params, 
    responseType: 'blob' 
  }),
};

// Client API
export const clientAPI = {
  getClients: (params = {}) => api.get('/api/clients/', { params }),
  getClient: (id) => api.get(`/api/clients/${id}/`),
  createClient: (clientData) => api.post('/api/clients/', clientData),
  updateClient: (id, clientData) => api.put(`/api/clients/${id}/`, clientData),
  deleteClient: (id) => api.delete(`/api/clients/${id}/`),
  searchClients: (query) => api.get('/api/clients/search/', { params: { q: query } }),
};

// Payment API
export const paymentAPI = {
  createCheckoutSession: (data) => api.post('/api/payments/create-checkout/', data),
  getPaymentStatus: (paymentId) => api.get(`/api/payments/status/${paymentId}/`),
  getInvoicePayments: (invoiceId) => api.get(`/api/payments/invoice/${invoiceId}/`),
};

// Messaging API
export const messagingAPI = {
  sendInvoiceNotification: (data) => api.post('/api/messaging/send-invoice/', data),
  sendPaymentConfirmation: (data) => api.post('/api/messaging/send-payment-confirmation/', data),
  sendPaymentReminder: (data) => api.post('/api/messaging/send-reminder/', data),
  getTemplates: () => api.get('/api/messaging/templates/'),
  getTemplate: (id) => api.get(`/api/messaging/templates/${id}/`),
  createTemplate: (templateData) => api.post('/api/messaging/templates/', templateData),
  updateTemplate: (id, templateData) => api.put(`/api/messaging/templates/${id}/`, templateData),
  deleteTemplate: (id) => api.delete(`/api/messaging/templates/${id}/`),
  getNotifications: (params = {}) => api.get('/api/messaging/notifications/', { params }),
  getNotification: (id) => api.get(`/api/messaging/notifications/${id}/`),
  retryFailedNotifications: () => api.post('/api/messaging/retry-failed/'),
};

// Utility functions
export const downloadFile = (url, filename) => {
  return api.get(url, { responseType: 'blob' }).then((response) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
};

// Authentication utilities
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  return !!(token && refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const logout = () => {
  clearAuthTokens();
  window.location.href = '/';
};

export default api; 