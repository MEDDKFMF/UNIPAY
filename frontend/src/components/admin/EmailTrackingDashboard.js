import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const EmailTrackingDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEmailStats();
  }, []);

  const loadEmailStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/invoices/email-tracking/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading email stats:', error);
      setError('Failed to load email tracking statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.total_invoices,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Emails Sent',
      value: stats.emails_sent,
      icon: EnvelopeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Delivered',
      value: stats.emails_delivered,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Opened',
      value: stats.emails_opened,
      icon: EyeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Clicked',
      value: stats.emails_clicked,
      icon: CursorArrowRaysIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Bounced',
      value: stats.emails_bounced,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const rateCards = [
    {
      title: 'Delivery Rate',
      value: `${stats.delivery_rate}%`,
      description: 'Emails successfully delivered',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Open Rate',
      value: `${stats.open_rate}%`,
      description: 'Emails opened by recipients',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Click Rate',
      value: `${stats.click_rate}%`,
      description: 'Payment links clicked',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Bounce Rate',
      value: `${stats.bounce_rate}%`,
      description: 'Emails that bounced',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Tracking Dashboard</h2>
          <p className="text-gray-600">Monitor email delivery and engagement metrics</p>
        </div>
        <button
          onClick={loadEmailStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rateCards.map((rate, index) => (
          <div key={index} className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">{rate.title}</p>
                <p className={`text-3xl font-bold ${rate.color}`}>{rate.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${rate.bgColor}`}>
                <ChartBarIcon className={`h-6 w-6 ${rate.color}`} />
              </div>
            </div>
            <p className="text-sm text-gray-500">{rate.description}</p>
          </div>
        ))}
      </div>

      {/* Email Timeline */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
          Email Engagement Timeline
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-blue-600 mr-3" />
              <span className="font-medium text-gray-900">Emails Sent</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{stats.emails_sent}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
              <span className="font-medium text-gray-900">Delivered</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{stats.emails_delivered}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <EyeIcon className="h-5 w-5 text-purple-600 mr-3" />
              <span className="font-medium text-gray-900">Opened</span>
            </div>
            <span className="text-2xl font-bold text-purple-600">{stats.emails_opened}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center">
              <CursorArrowRaysIcon className="h-5 w-5 text-orange-600 mr-3" />
              <span className="font-medium text-gray-900">Clicked</span>
            </div>
            <span className="text-2xl font-bold text-orange-600">{stats.emails_clicked}</span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Email Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery Success Rate</span>
                <span className={`text-sm font-medium ${stats.delivery_rate >= 95 ? 'text-green-600' : stats.delivery_rate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.delivery_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className={`text-sm font-medium ${stats.open_rate >= 25 ? 'text-green-600' : stats.open_rate >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.open_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className={`text-sm font-medium ${stats.click_rate >= 5 ? 'text-green-600' : stats.click_rate >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.click_rate}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recommendations</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {stats.bounce_rate > 5 && (
                <p className="text-red-600">• High bounce rate detected. Consider cleaning email list.</p>
              )}
              {stats.open_rate < 15 && (
                <p className="text-yellow-600">• Low open rate. Try improving subject lines.</p>
              )}
              {stats.click_rate < 2 && (
                <p className="text-yellow-600">• Low click rate. Consider improving call-to-action.</p>
              )}
              {stats.delivery_rate >= 95 && stats.open_rate >= 25 && stats.click_rate >= 5 && (
                <p className="text-green-600">• Excellent email performance! Keep up the great work.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTrackingDashboard;
