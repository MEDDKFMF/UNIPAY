import React, { useEffect, useState } from 'react';
import { isAuthenticated, clearAuthTokens } from '../services/api';

const AuthGuard = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setIsAuth(true);
      } else {
        clearAuthTokens();
        window.location.href = '/';
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuth) {
    return null; // Will redirect to login
  }

  return children;
};

export default AuthGuard;
