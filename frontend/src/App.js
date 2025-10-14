import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import CreateInvoice from './pages/CreateInvoice';
import ViewInvoice from './pages/ViewInvoice';
import EditInvoice from './pages/EditInvoice';
import ClientList from './pages/ClientList';
import CreateClient from './pages/CreateClient';
import ViewClient from './pages/ViewClient';
import EditClient from './pages/EditClient';
import Analytics from './pages/Analytics';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import PaymentSettings from './pages/PaymentSettings';
import RecurringPayments from './pages/RecurringPayments';
import NotificationSettings from './pages/NotificationSettings';
import Layout from './components/Layout';
// Admin
import AdminGuard from './components/AdminGuard';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlans from './pages/admin/AdminPlans';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSessions from './pages/admin/AdminSessions';
import AdminSettings from './pages/admin/AdminSettings';

const LazyPaymentMpesa = lazy(() => import('./pages/PaymentMpesaPage'));
const LazyPublicPay = lazy(() => import('./pages/PublicPayPage'));
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (isAuthenticated && user && user.role) {
    const redirectTo = user.role === 'platform_admin' ? '/admin/overview' : '/app/dashboard';
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/pay/:token" element={
          <Suspense fallback={<div>Loading...</div>}>
            <LazyPublicPay />
          </Suspense>
        } />
        
        {/* Protected Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/create" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<ViewInvoice />} />
          <Route path="invoices/:id/edit" element={<EditInvoice />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/create" element={<CreateClient />} />
          <Route path="clients/:id" element={<ViewClient />} />
          <Route path="clients/:id/edit" element={<EditClient />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="payments" element={<Payments />} />
          <Route path="payments/:id/mpesa" element={
            <Suspense fallback={<div>Loading...</div>}>
              <LazyPaymentMpesa />
            </Suspense>
          } />
          <Route path="recurring-payments" element={<RecurringPayments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="payment-settings" element={<PaymentSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
        </Route>

        {/* Platform Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminDashboard />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch('https://unipay-oyn6.onrender.com/api/auth/login/', { method: 'OPTIONS' });
      } catch (_) {}
    };
    ping();
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App; 
