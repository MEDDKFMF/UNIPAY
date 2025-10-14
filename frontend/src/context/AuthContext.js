import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

  // Session timeout configuration (minutes)
  const IDLE_TIMEOUT_MINUTES = Number(process.env.REACT_APP_IDLE_TIMEOUT_MINUTES) || 15; // default 15 minutes
  const WARNING_MINUTES = Number(process.env.REACT_APP_WARNING_MINUTES) || 1; // default show warning 1 minute before timeout

  const idleTimeoutMs = IDLE_TIMEOUT_MINUTES * 60 * 1000;
  const warningTimeoutMs = Math.max(0, idleTimeoutMs - WARNING_MINUTES * 60 * 1000);

  // Refs to store timers and state across renders
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const warningToastIdRef = useRef(null);
  const resetIdleTimersRef = useRef(null);

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
    // Clear any timers when logging out
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
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

  const refreshToken = useCallback(async () => {
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
  }, [logout]);

  // Inactivity handling
  const handleIdleLogout = useCallback(() => {
    logger.info('User idle timeout reached, logging out');
    toast.error('You have been logged out due to inactivity');
    logout();
  }, [logout]);

  const handleShowWarning = useCallback(() => {
    // Show a warning toast with a Stay signed in button
    if (warningToastIdRef.current) return; // already showing

    warningToastIdRef.current = toast((t) => (
      <div className="flex flex-col">
        <div className="font-medium">Session expiring soon</div>
        <div className="text-xs text-gray-500 mt-1">You will be signed out due to inactivity soon.</div>
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              warningToastIdRef.current = null;
              try {
                await refreshToken();
                // reset timers after a successful refresh (via ref to avoid circular deps)
                resetIdleTimersRef.current?.();
                toast.success('Session extended');
              } catch (err) {
                logger.error('Failed to refresh token from warning action', err);
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Stay signed in
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              warningToastIdRef.current = null;
              handleIdleLogout();
            }}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs"
          >
            Sign out now
          </button>
        </div>
      </div>
    ), { duration: 1000 * 60 * 5 }); // keep for up to 5 minutes or until dismissed
  }, [refreshToken, handleIdleLogout]);

  const resetIdleTimers = useCallback(() => {
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }

    // Set new timers only when authenticated
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();

    warningTimerRef.current = setTimeout(() => {
      handleShowWarning();
    }, warningTimeoutMs);

    idleTimerRef.current = setTimeout(() => {
      handleIdleLogout();
    }, idleTimeoutMs);
  }, [isAuthenticated, warningTimeoutMs, idleTimeoutMs, handleShowWarning, handleIdleLogout]);

  // Keep ref updated with the latest resetIdleTimers function
  useEffect(() => {
    resetIdleTimersRef.current = resetIdleTimers;
    return () => {
      resetIdleTimersRef.current = null;
    };
  }, [resetIdleTimers]);

  // Activity handler
  const activityHandler = useCallback(() => {
    // Update last activity and reset timers
    lastActivityRef.current = Date.now();
    resetIdleTimers();
  }, [resetIdleTimers]);

  // Attach activity listeners when authenticated
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, activityHandler));

    // Initialize timers
    resetIdleTimers();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, activityHandler));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (warningToastIdRef.current) {
        toast.dismiss(warningToastIdRef.current);
        warningToastIdRef.current = null;
      }
    };
  }, [isAuthenticated, activityHandler, resetIdleTimers]);

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