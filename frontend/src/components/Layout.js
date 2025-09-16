import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  Plus,
  ChevronRight,
  BarChart3,
  CreditCard,
  Cog,
  DollarSign,
  Clock,
  Send,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Organized navigation with logical grouping
  const navigation = [
    // Main Dashboard
    { name: 'Dashboard', href: '/app/dashboard', icon: Home, badge: null, category: 'main' },
    
    // Invoice Management
    { name: 'Invoices', href: '/app/invoices', icon: FileText, badge: null, category: 'invoices' },
    { name: 'Create Invoice', href: '/app/invoices/create', icon: Plus, badge: null, category: 'invoices' },
    
    // Client Management
    { name: 'Clients', href: '/app/clients', icon: Users, badge: null, category: 'clients' },
    { name: 'Add Client', href: '/app/clients/create', icon: Plus, badge: null, category: 'clients' },
    
    // Analytics & Reports
    { name: 'Analytics', href: '/app/analytics', icon: BarChart3, badge: null, category: 'analytics' },
    
    // Payment Management
    { name: 'Payments', href: '/app/payments', icon: CreditCard, badge: null, category: 'payments' },
    { name: 'Payment Settings', href: '/app/payment-settings', icon: Cog, badge: null, category: 'payments' },
    
    // Settings & Configuration
    { name: 'Notifications', href: '/app/notifications', icon: Bell, badge: null, category: 'settings' },
    { name: 'Settings', href: '/app/settings', icon: Settings, badge: null, category: 'settings' },
  ];

  // Quick actions for the top bar
  const quickActions = [
    {
      name: 'New Invoice',
      href: '/app/invoices/create',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Create a new invoice'
    },
    {
      name: 'Add Client',
      href: '/app/clients/create',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Add a new client'
    },
    {
      name: 'View Analytics',
      href: '/app/analytics',
      icon: BarChart3,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'View business analytics'
    },
    {
      name: 'Payment Settings',
      href: '/app/payment-settings',
      icon: Cog,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'Configure payment methods'
    }
  ];

  // Group navigation by category
  const groupedNavigation = navigation.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    main: 'Main',
    invoices: 'Invoice Management',
    clients: 'Client Management',
    analytics: 'Analytics & Reports',
    payments: 'Payment Management',
    settings: 'Settings & Configuration'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">UniPay</h1>
                <p className="text-xs text-gray-500">Invoice Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {Object.entries(groupedNavigation).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center">
                          <Icon className={`w-5 h-5 mr-3 ${
                            active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`} />
                          {item.name}
                        </div>
                        {active && <ChevronRight className="w-4 h-4 text-blue-600" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <NotificationBell />
              
              {/* Quick Actions Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Quick Actions</span>
                  <ChevronRight className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={index}
                          to={action.href}
                          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{action.name}</p>
                            <p className="text-xs text-gray-500">{action.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 