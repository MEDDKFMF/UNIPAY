import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://unipay-1gus.onrender.com/api',
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
          const response = await api.post('/auth/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (profileData) => api.put('/auth/profile/update/', profileData),
  refreshToken: (refresh) => api.post('/auth/refresh/', { refresh }),
  getStats: () => api.get('/auth/stats/'),
};

// Invoice API
export const invoiceAPI = {
  getInvoices: (params = {}) => api.get('/invoices/', { params }),
  getInvoice: (id) => api.get(`/invoices/${id}/`),
  createInvoice: (invoiceData) => api.post('/invoices/', invoiceData),
  updateInvoice: (id, invoiceData) => api.put(`/invoices/${id}/`, invoiceData),
  deleteInvoice: (id) => api.delete(`/invoices/${id}/`),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status/`, { status }),
  getPDF: (id) => api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' }),
  getStats: () => api.get('/invoices/stats/'),
  exportCSV: (params = {}) => api.get('/invoices/export/', { 
    params, 
    responseType: 'blob' 
  }),
};

// Client API
export const clientAPI = {
  getClients: (params = {}) => api.get('/clients/', { params }),
  getClient: (id) => api.get(`/clients/${id}/`),
  createClient: (clientData) => api.post('/clients/', clientData),
  updateClient: (id, clientData) => api.put(`/clients/${id}/`, clientData),
  deleteClient: (id) => api.delete(`/clients/${id}/`),
  searchClients: (query) => api.get('/clients/search/', { params: { q: query } }),
};

// Payment API
export const paymentAPI = {
  createCheckoutSession: (data) => api.post('/payments/create-checkout/', data),
  getPaymentStatus: (paymentId) => api.get(`/payments/status/${paymentId}/`),
  getInvoicePayments: (invoiceId) => api.get(`/payments/invoice/${invoiceId}/`),
};

// Messaging API
export const messagingAPI = {
  sendInvoiceNotification: (data) => api.post('/messaging/send-invoice/', data),
  sendPaymentConfirmation: (data) => api.post('/messaging/send-payment-confirmation/', data),
  sendPaymentReminder: (data) => api.post('/messaging/send-reminder/', data),
  getTemplates: () => api.get('/messaging/templates/'),
  getTemplate: (id) => api.get(`/messaging/templates/${id}/`),
  createTemplate: (templateData) => api.post('/messaging/templates/', templateData),
  updateTemplate: (id, templateData) => api.put(`/messaging/templates/${id}/`, templateData),
  deleteTemplate: (id) => api.delete(`/messaging/templates/${id}/`),
  getNotifications: (params = {}) => api.get('/messaging/notifications/', { params }),
  getNotification: (id) => api.get(`/messaging/notifications/${id}/`),
  retryFailedNotifications: () => api.post('/messaging/retry-failed/'),
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