import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AdminSubscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewingSub, setViewingSub] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [subscriptionStats, setSubscriptionStats] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      // Load both subscriptions and statistics
      const [subsResponse, statsResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/payments/subscriptions/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/payments/admin/metrics/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const subsData = subsResponse.data.results || subsResponse.data;
      setSubs(Array.isArray(subsData) ? subsData : []);
      setSubscriptionStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError(error.message);
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateSubscriptionStatus = async (subId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:8000/api/payments/subscriptions/${subId}/`, {
        status: newStatus
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      load();
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const cancelSubscription = async (subId) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.patch(`http://localhost:8000/api/payments/subscriptions/${subId}/`, {
          status: 'cancelled'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        load();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
      }
    }
  };

  // Get unique plans for filter
  const uniquePlans = [...new Set(subs.map(sub => sub.plan?.name).filter(Boolean))];

  // Filter and sort subscriptions
  const filteredSubs = subs
    .filter(sub => {
      const matchesSearch = 
        sub.owner?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
      const matchesPlan = filterPlan === 'all' || sub.plan?.name === filterPlan;
      
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'current_period_end') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">All active and trial subscriptions</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">All active and trial subscriptions</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading subscriptions: {error}</p>
          <button 
            onClick={load}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">Manage all platform subscriptions</p>
        </div>
        <button
          onClick={load}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Subscription Statistics */}
      {subscriptionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{subscriptionStats.total_subscriptions || 0}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-blue-600">
              {subs.filter(s => s.status === 'active').length} active
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{subscriptionStats.active_subscriptions || 0}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-green-600">
              {subs.filter(s => s.status === 'trialing').length} in trial
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${Number(subscriptionStats.mrr || 0).toFixed(2)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 text-sm text-purple-600">
              From active subscriptions
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subs.filter(s => s.status === 'cancelled').length}
                </p>
              </div>
              <XMarkIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2 text-sm text-red-600">
              {subscriptionStats.churn_rate || 0}% churn rate
            </div>
          </div>
        </div>
      )}

      {/* Advanced Controls */}
      <div className="bg-white rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Plans</option>
              {uniquePlans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Created Date</option>
              <option value="current_period_end">Period End</option>
              <option value="status">Status</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center justify-center"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Subscriptions ({filteredSubs.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {filteredSubs.length} of {subs.length} subscriptions
            </div>
          </div>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3 font-medium text-gray-700">Subscriber</th>
              <th className="p-3 font-medium text-gray-700">Plan</th>
              <th className="p-3 font-medium text-gray-700">Status</th>
              <th className="p-3 font-medium text-gray-700">Billing</th>
              <th className="p-3 font-medium text-gray-700">Period</th>
              <th className="p-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map(sub => (
              <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {sub.owner?.username || sub.owner?.email || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">{sub.owner?.email}</div>
                    <div className="text-xs text-gray-400">
                      ID: {sub.id}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div className="font-medium text-gray-900">{sub.plan?.name || 'No Plan'}</div>
                    <div className="text-sm text-gray-500">
                      {sub.plan?.price} {sub.plan?.currency} / {sub.plan?.interval}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    sub.status === 'active' ? 'bg-green-100 text-green-800' :
                    sub.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                    sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    sub.status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    <div className="text-gray-900">
                      {sub.plan?.price} {sub.plan?.currency}
                    </div>
                    <div className="text-gray-500 capitalize">
                      per {sub.plan?.interval}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    <div className="text-gray-900">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-gray-500">
                      {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingSub(sub)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {sub.status === 'active' && (
                      <button
                        onClick={() => cancelSubscription(sub.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Cancel Subscription"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                    {sub.status === 'cancelled' && (
                      <button
                        onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Reactivate Subscription"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subscription Details Modal */}
      {viewingSub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Subscription Details
              </h2>
              <button
                onClick={() => setViewingSub(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Subscription Info
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subscription ID</label>
                      <p className="text-gray-900 font-mono">{viewingSub.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        viewingSub.status === 'active' ? 'bg-green-100 text-green-800' :
                        viewingSub.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                        viewingSub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        viewingSub.status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingSub.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <p className="text-gray-900">{new Date(viewingSub.created_at).toLocaleDateString()}</p>
                    </div>
                    {viewingSub.provider_subscription_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Provider Subscription ID</label>
                        <p className="text-gray-900 font-mono text-sm">{viewingSub.provider_subscription_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCardIcon className="h-5 w-5 text-green-500 mr-2" />
                    Billing
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Plan</label>
                      <p className="text-gray-900">{viewingSub.plan?.name || 'No Plan'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Price</label>
                      <p className="text-2xl font-bold text-gray-900">
                        {viewingSub.plan?.price} {viewingSub.plan?.currency}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Billing Interval</label>
                      <p className="text-gray-900 capitalize">{viewingSub.plan?.interval}</p>
                    </div>
                    {viewingSub.plan?.trial_days > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Trial Period</label>
                        <p className="text-gray-900">{viewingSub.plan.trial_days} days</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Period and Usage Information */}
              <div className="space-y-6">
                {/* Current Period */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-purple-500 mr-2" />
                    Current Period
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Period Start</label>
                      <p className="text-gray-900">
                        {viewingSub.current_period_start ? new Date(viewingSub.current_period_start).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Period End</label>
                      <p className="text-gray-900">
                        {viewingSub.current_period_end ? new Date(viewingSub.current_period_end).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {viewingSub.current_period_end && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Days Remaining</label>
                        <p className="text-gray-900">
                          {Math.ceil((new Date(viewingSub.current_period_end) - new Date()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscriber Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UsersIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Subscriber
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      <p className="text-gray-900">{viewingSub.owner?.username || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{viewingSub.owner?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">
                        {viewingSub.owner?.first_name && viewingSub.owner?.last_name 
                          ? `${viewingSub.owner.first_name} ${viewingSub.owner.last_name}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Organization</label>
                      <p className="text-gray-900">{viewingSub.organization?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                {viewingSub.plan?.features && Array.isArray(viewingSub.plan.features) && viewingSub.plan.features.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckIcon className="h-5 w-5 text-purple-500 mr-2" />
                      Plan Features
                    </h3>
                    <div className="space-y-2">
                      {viewingSub.plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-900">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {viewingSub.status === 'active' && (
                <button
                  onClick={() => {
                    cancelSubscription(viewingSub.id);
                    setViewingSub(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancel Subscription
                </button>
              )}
              {viewingSub.status === 'cancelled' && (
                <button
                  onClick={() => {
                    updateSubscriptionStatus(viewingSub.id, 'active');
                    setViewingSub(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Reactivate Subscription
                </button>
              )}
              <button
                onClick={() => setViewingSub(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;


