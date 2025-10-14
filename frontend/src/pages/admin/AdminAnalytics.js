import React, { useEffect, useState } from 'react';
import logger from '../../utils/logger';
import api from '../../services/api';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  CurrencyDollarIcon, 
  UsersIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        
        // Load comprehensive analytics data
        const [metricsResponse, detailedResponse] = await Promise.all([
          api.get(`/api/payments/admin/metrics/?time_range=${timeRange}`),
          api.get(`/api/payments/admin/analytics/detailed/?time_range=${timeRange}`)
        ]);

        // Process and combine data
        const processedData = {
          metrics: metricsResponse.data,
          detailed: detailedResponse.data,
          timeRange,
          generatedAt: new Date().toLocaleString()
        };

        setAnalytics(processedData);
      } catch (error) {
  logger.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Platform performance insights</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Platform performance insights</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const calculateMetrics = () => {
    const { metrics } = analytics;
    
    // Use real data from backend
    const activeUsers = metrics.total_users;
    const userGrowthRate = metrics.user_growth_rate || 0;
    const revenuePerUser = metrics.total_users > 0 ? (metrics.mrr / metrics.total_users).toFixed(2) : 0;
    const conversionRate = metrics.total_users > 0 ? ((metrics.active_subscriptions / metrics.total_users) * 100).toFixed(1) : 0;
    const usersWithSubs = metrics.active_subscriptions;
    
    return {
      activeUsers,
      userGrowthRate,
      revenuePerUser,
      conversionRate,
      usersWithSubs
    };
  };

  const calculatedMetrics = calculateMetrics();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform performance insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <div className="text-sm text-gray-500">
            Generated: {analytics.generatedAt}
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(analytics.metrics?.mrr || 0).toFixed(2)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
                      <div className="mt-2 text-sm text-green-600">
              <ArrowTrendingUpIcon className="h-4 w-4 inline mr-1" />
              {analytics.metrics.user_growth_rate > 0 ? '+' : ''}{analytics.metrics.user_growth_rate}% user growth
            </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{calculatedMetrics.activeUsers}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-blue-600">
            {calculatedMetrics.userGrowthRate}% of total users active
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{calculatedMetrics.conversionRate}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-sm text-purple-600">
            {calculatedMetrics.usersWithSubs} users with subscriptions
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue per User</p>
              <p className="text-2xl font-bold text-gray-900">${calculatedMetrics.revenuePerUser}</p>
            </div>
                         <ArrowTrendingUpIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 text-sm text-orange-600">
            Average monthly revenue per user
          </div>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Demographics */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="h-5 w-5 text-blue-500 mr-2" />
            User Demographics
          </h3>
          <div className="space-y-4">
            {analytics.detailed?.user_demographics?.by_role?.map((role, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{role.role.replace('_', ' ')}</span>
                <span className="font-medium">{role.count}</span>
              </div>
            )) || (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Clients</span>
                  <span className="font-medium">{analytics.metrics.total_users}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">With Subscriptions</span>
                  <span className="font-medium">{analytics.metrics.active_subscriptions}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subscription Analytics */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 text-green-500 mr-2" />
            Subscription Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Plans</span>
              <span className="font-medium">{analytics.metrics?.total_plans || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Subscriptions</span>
              <span className="font-medium">{analytics.metrics?.active_subscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Organizations</span>
              <span className="font-medium">{analytics.metrics?.total_organizations || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Churn Rate</span>
              <span className="font-medium text-red-600">{analytics.metrics?.churn_rate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trends */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                     <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
           Revenue Trends
        </h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
            <p>Revenue chart visualization</p>
            <p className="text-sm">Chart.js or Recharts integration would go here</p>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <GlobeAltIcon className="h-5 w-5 text-blue-500 mr-2" />
          Geographic Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.metrics?.geographic_distribution?.north_america || 0}
            </div>
            <div className="text-sm text-blue-800">North America</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analytics.metrics?.geographic_distribution?.europe || 0}
            </div>
            <div className="text-sm text-green-800">Europe</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.metrics?.geographic_distribution?.asia || 0}
            </div>
            <div className="text-sm text-orange-800">Asia</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.metrics?.geographic_distribution?.africa || 0}
            </div>
            <div className="text-sm text-yellow-800">Africa</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {analytics.metrics?.geographic_distribution?.south_america || 0}
            </div>
            <div className="text-sm text-red-800">South America</div>
          </div>
          <div className="text-center p-4 bg-cyan-50 rounded-lg">
            <div className="text-2xl font-bold text-cyan-600">
              {analytics.metrics?.geographic_distribution?.oceania || 0}
            </div>
            <div className="text-sm text-cyan-800">Oceania</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.metrics?.geographic_distribution?.middle_east || 0}
            </div>
            <div className="text-sm text-purple-800">Middle East</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">
              {analytics.metrics?.geographic_distribution?.central_america || 0}
            </div>
            <div className="text-sm text-pink-800">Central America</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 text-orange-500 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {analytics.detailed?.recent_activity?.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {activity.user?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activity.type === 'user_registration' ? 'bg-blue-100 text-blue-800' :
                activity.type === 'organization_created' ? 'bg-green-100 text-green-800' :
                activity.type === 'subscription_created' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activity.type.replace('_', ' ')}
              </span>
            </div>
          )) || (
            <div className="text-center py-4 text-gray-500">
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
