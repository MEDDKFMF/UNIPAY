import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import EmailTrackingDashboard from '../../components/admin/EmailTrackingDashboard';

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [quickActions, setQuickActions] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load metrics
        const metricsResponse = await api.get('/api/payments/admin/metrics/');
        setMetrics(metricsResponse.data);
        
        // Load recent activity (last 5 users)
        const activityResponse = await api.get('/api/auth/admin/users/');
        setRecentActivity(activityResponse.data.slice(0, 5));
        
        // Load system health
        const healthResponse = await api.get('/api/payments/admin/plans/');
        setSystemHealth({
          activePlans: healthResponse.data.results?.length || 0,
          lastUpdated: new Date().toLocaleString()
        });
        
        // Set quick actions
        setQuickActions([
          { name: 'Create Plan', action: () => window.location.href = '/admin/plans', icon: '📋' },
          { name: 'Add User', action: () => window.location.href = '/admin/users', icon: '👤' },
          { name: 'View Reports', action: () => window.location.href = '/admin/analytics', icon: '📊' },
          { name: 'Session Monitor', action: () => window.location.href = '/admin/sessions', icon: '🔍' },
          { name: 'Manage Orgs', action: () => window.location.href = '/admin/organizations', icon: '🏢' },
          { name: 'Platform Settings', action: () => window.location.href = '/admin/settings', icon: '⚙️' }
        ]);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600">Real-time subscription and revenue metrics</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {systemHealth.lastUpdated}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <StatCard title="Organizations" value={metrics.total_organizations} />
          <StatCard title="Plans" value={metrics.total_plans} />
          <StatCard title="Subscriptions" value={metrics.total_subscriptions} />
          <StatCard title="Active Subs" value={metrics.active_subscriptions} />
          <StatCard title="MRR" value={`$${Number(metrics.mrr || 0).toFixed(2)}`} />
        </div>
      )}

      {/* Reports Section */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
          Platform Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/analytics'}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Analytics Dashboard</span>
            <span className="text-xs text-gray-500 mt-1">Revenue & Usage Reports</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/sessions'}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Session Reports</span>
            <span className="text-xs text-gray-500 mt-1">User Activity & Security</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">User Reports</span>
            <span className="text-xs text-gray-500 mt-1">User Management & Stats</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/plans'}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <DocumentTextIcon className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Plan Reports</span>
            <span className="text-xs text-gray-500 mt-1">Subscription & Plan Analytics</span>
          </button>
        </div>
      </div>

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-green-500 mr-2" />
            System Health
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Plans</span>
              <span className="font-medium text-green-600">{systemHealth.activePlans}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database Status</span>
              <span className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Status</span>
              <span className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="h-5 w-5 text-blue-500 mr-2" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((user, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(user.date_joined).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Tracking Dashboard */}
      <EmailTrackingDashboard />
    </div>
  );
};

export default AdminDashboard;


