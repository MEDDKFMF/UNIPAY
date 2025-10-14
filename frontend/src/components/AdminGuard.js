import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'platform_admin') {
    logger.debug('AdminGuard: User not admin', { user: user?.username, role: user?.role });
    return <Navigate to="/app/dashboard" replace />;
  }
  
  logger.debug('AdminGuard: User is admin, allowing access', { user: user?.username, role: user?.role });

  return children ? children : <Outlet />;
};

export default AdminGuard;


