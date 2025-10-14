import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRightOnRectangleIcon, 
  Bars3Icon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 text-white flex flex-col transform transition-all duration-300 ease-in-out`}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          {!sidebarCollapsed && (
            <span className="text-lg font-bold">UniPay Admin</span>
          )}
          <div className="flex items-center space-x-2">
            {/* Collapse/Expand button - only show on desktop */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Close button - only show on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink 
            to="/admin/overview" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Overview"
          >
            <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Overview</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/analytics" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Analytics"
          >
            <ArrowTrendingUpIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Analytics</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/plans" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Plans"
          >
            <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Plans</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/subscriptions" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Subscriptions"
          >
            <CreditCardIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Subscriptions</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Users"
          >
            <UsersIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Users</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/sessions" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Sessions"
          >
            <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Sessions</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/organizations" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Organizations"
          >
            <BuildingOffice2Icon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Organizations</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/settings" 
            className={({isActive}) => `flex items-center px-3 py-2 rounded transition-colors ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
            title="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Settings</span>}
          </NavLink>
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 text-xs text-slate-400">Platform Management</div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            
            <h1 className="text-slate-800 font-semibold">Admin Console</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">
              Welcome, {user?.first_name || user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>
        
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;




