import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { clearAuthTokens } from '../services/api';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    // The API instance handles token management automatically
  }, []);

  const logout = useCallback(() => {
    // Clear tokens using centralized function
    clearAuthTokens();
    
    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
    
    toast.success('Logged out successfully');
  }, []);

  const checkAuthStatus = useCallback(async () => {
  logger.debug('checkAuthStatus called');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        logger.debug('No token found, setting loading to false');
        setLoading(false);
        return;
      }

      logger.debug('Token found, fetching profile...');
      // Get user profile using the centralized API instance
      const response = await api.get('/api/auth/profile/');
  logger.debug('Profile response:', response.data);
  logger.debug('Profile role:', response.data.role);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
  logger.error('Auth check failed:', error);
      // Only logout if it's an authentication error, not a network error
      if (error.response?.status === 401) {
  logger.debug('401 error, calling logout');
      logout();
      } else {
        // For network errors, just set loading to false
  logger.debug('Network error, setting loading to false');
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/auth/login/', credentials);
      const { access, refresh, user_id, username, email, role, first_name, last_name, company_name } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Set user data
      const userData = {
        id: user_id,
        username,
        email,
        role,
        first_name,
        last_name,
        company_name
      };
      
  logger.debug('Login response:', response.data);
  logger.debug('Setting user data:', userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      // Return user data so caller can navigate based on role without waiting for profile fetch
      return { success: true, user: userData };
    } catch (error) {
  logger.error('Login error:', error);
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      await api.post('/api/auth/register/', userData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
  logger.error('Registration error:', error);
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };


  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile/update/', profileData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
  logger.error('Profile update error:', error);
      const message = error.response?.data?.detail || 'Profile update failed.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/api/auth/refresh/', { refresh });
      const { access } = response.data;
      
      localStorage.setItem('access_token', access);
      
      return access;
    } catch (error) {
  logger.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Token refresh is now handled by the centralized API instance

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 