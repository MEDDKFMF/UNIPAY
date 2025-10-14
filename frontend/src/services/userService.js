// User service for API calls
import api from './api';
import logger from '../utils/logger';

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/profile/');
    return response.data;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/api/auth/profile/', profileData);
    return response.data;
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
};

// Change user password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.post('/api/auth/change-password/', passwordData);
    return response.data;
  } catch (error) {
    logger.error('Error changing password:', error);
    throw error;
  }
};

// Upload user avatar
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/api/auth/upload-avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    throw error;
  }
};

// ===== NEW SETTINGS API FUNCTIONS =====

// Get user profile settings
export const getUserProfileSettings = async () => {
  try {
    const response = await api.get('/api/settings/profile/');
    return response.data;
  } catch (error) {
    logger.error('Error fetching user profile settings:', error);
    throw error;
  }
};

// Update user profile settings
export const updateUserProfileSettings = async (settingsData) => {
  try {
    const response = await api.put('/api/settings/profile/update/', settingsData);
    return response.data;
  } catch (error) {
    logger.error('Error updating user profile settings:', error);
    throw error;
  }
};

// Get invoice header data
export const getInvoiceHeaderData = async () => {
  try {
    const response = await api.get('/api/settings/profile/header/');
    return response.data;
  } catch (error) {
    logger.error('Error fetching invoice header data:', error);
    throw error;
  }
};

// Get platform settings (read-only)
export const getPlatformSettings = async () => {
  try {
    const response = await api.get('/api/settings/platform/');
    return response.data;
  } catch (error) {
    logger.error('Error fetching platform settings:', error);
    throw error;
  }
};

// Get supported currencies
export const getSupportedCurrencies = async () => {
  try {
    const response = await api.get('/api/settings/currencies/');
    return response.data;
  } catch (error) {
    logger.error('Error fetching supported currencies:', error);
    throw error;
  }
};

// Test email settings
export const testEmailSettings = async () => {
  try {
    const response = await api.post('/api/settings/test-email/');
    return response.data;
  } catch (error) {
    logger.error('Error testing email settings:', error);
    throw error;
  }
};