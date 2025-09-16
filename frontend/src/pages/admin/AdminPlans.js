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
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [planStats, setPlanStats] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    price: 0, 
    currency: 'USD', 
    interval: 'month', 
    description: '', 
    features: '',
    limits: '',
    is_active: true,
    trial_days: 0
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading plans...');
      const token = localStorage.getItem('access_token');
      console.log('Auth token:', token);
      
      // Load both plans and statistics
      const [plansResponse, statsResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/payments/admin/plans/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/payments/admin/metrics/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      console.log('Plans response:', plansResponse);
      console.log('Stats response:', statsResponse);
      
      // Handle paginated response structure
      const plansData = plansResponse.data.results || plansResponse.data;
      const plansArray = Array.isArray(plansData) ? plansData : [];
      console.log('Processed plans:', plansArray);
      
      setPlans(plansArray);
      setPlanStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading plans:', error);
      setError(error.message);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    console.log('AdminPlans mounted, plans state:', plans);
    load(); 
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      
      // Process features from comma-separated string to array
      const planData = {
        ...form,
        features: form.features ? form.features.split(',').map(f => f.trim()).filter(f => f) : [],
        limits: form.limits ? JSON.parse(form.limits) : {}
      };
      
      await axios.post('http://localhost:8000/api/payments/admin/plans/', planData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setForm({ name: '', price: 0, currency: 'USD', interval: 'month', description: '', features: '', limits: '', is_active: true, trial_days: 0 });
      setShowCreateForm(false);
      load();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const updatePlan = async (planId) => {
    try {
      const token = localStorage.getItem('access_token');
      const planData = {
        ...editingPlan,
        features: editingPlan.features ? editingPlan.features.split(',').map(f => f.trim()).filter(f => f) : [],
        limits: editingPlan.limits ? JSON.parse(editingPlan.limits) : {}
      };
      
      await axios.put(`http://localhost:8000/api/payments/admin/plans/${planId}/`, planData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEditingPlan(null);
      load();
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const deletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`http://localhost:8000/api/payments/admin/plans/${planId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        load();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:8000/api/payments/admin/plans/${planId}/`, {
        is_active: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      load();
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  // Filter and sort plans
  const filteredPlans = plans
    .filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && plan.is_active) ||
                           (filterStatus === 'inactive' && !plan.is_active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
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
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600">Create and manage subscription plans</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600">Create and manage subscription plans</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading plans: {error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600">Create and manage subscription plans</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {showCreateForm ? 'Cancel' : 'Create Plan'}
        </button>
      </div>

      {/* Plan Statistics */}
      {planStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">{planStats.total_plans || 0}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-blue-600">
              {plans.filter(p => p.is_active).length} active
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{planStats.active_subscriptions || 0}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-green-600">
              {planStats.total_subscriptions || 0} total
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${Number(planStats.mrr || 0).toFixed(2)}
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
                <p className="text-sm text-gray-600">Avg. Plan Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${plans.length > 0 ? (plans.reduce((sum, plan) => sum + parseFloat(plan.price || 0), 0) / plans.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <StarIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 text-sm text-orange-600">
              Across all plans
            </div>
          </div>
        </div>
      )}

      {/* Advanced Controls */}
      <div className="bg-white rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search plans..."
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
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="created_at">Created Date</option>
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Plan</h2>
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                placeholder="Plan name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({...form, price: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({...form, currency: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="KES">KES</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
              <select
                value={form.interval}
                onChange={(e) => setForm({...form, interval: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trial Days</label>
              <input
                type="number"
                placeholder="0"
                value={form.trial_days}
                onChange={(e) => setForm({...form, trial_days: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <select
                value={form.is_active}
                onChange={(e) => setForm({...form, is_active: e.target.value === 'true'})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Plan description"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
              <input
                type="text"
                placeholder="Feature 1, Feature 2, Feature 3"
                value={form.features}
                onChange={(e) => setForm({...form, features: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Limits (JSON format)</label>
              <input
                type="text"
                placeholder='{"invoices_per_month": 100, "export_formats": ["PDF", "CSV"]}'
                value={form.limits}
                onChange={(e) => setForm({...form, limits: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Table */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Plans ({filteredPlans.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {filteredPlans.length} of {plans.length} plans
            </div>
          </div>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3 font-medium text-gray-700">Plan Details</th>
              <th className="p-3 font-medium text-gray-700">Pricing</th>
              <th className="p-3 font-medium text-gray-700">Status</th>
              <th className="p-3 font-medium text-gray-700">Features</th>
              <th className="p-3 font-medium text-gray-700">Usage</th>
              <th className="p-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map(plan => (
              <tr key={plan.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      {plan.name}
                      {plan.trial_days > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {plan.trial_days}d trial
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{plan.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created: {new Date(plan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-900">
                    {plan.price} {plan.currency}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">per {plan.interval}</div>
                  {plan.interval === 'year' && (
                    <div className="text-xs text-green-600">
                      ${(parseFloat(plan.price) / 12).toFixed(2)}/month
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {plan.provider_price_id && (
                      <span className="text-xs text-gray-500">
                        Provider ID: {plan.provider_price_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  {plan.features && Array.isArray(plan.features) ? (
                    <div className="space-y-1">
                      {plan.features.slice(0, 2).map((feature, index) => (
                        <div key={index} className="flex items-center text-xs">
                          <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{plan.features.length - 2} more features
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No features</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    <div className="flex items-center text-gray-600">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span>{plan.subscription_count || 0} subscribers</span>
                    </div>
                    {plan.limits && typeof plan.limits === 'object' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.keys(plan.limits).length} limits set
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingPlan(plan)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      className={`p-1 rounded ${
                        plan.is_active 
                          ? 'text-red-600 hover:bg-red-100' 
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={plan.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {plan.is_active ? <XMarkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete"
                      disabled={plan.subscription_count > 0}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Plan: {editingPlan.name}</h2>
            <form onSubmit={(e) => { e.preventDefault(); updatePlan(editingPlan.id); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <input
                    type="text"
                    value={Array.isArray(editingPlan.features) ? editingPlan.features.join(', ') : editingPlan.features}
                    onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Feature 1, Feature 2, Feature 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <select
                    value={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({...editingPlan, is_active: e.target.value === 'true'})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Plan Details: {viewingPlan.name}</h2>
              <button
                onClick={() => setViewingPlan(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Plan Name</label>
                      <p className="text-gray-900">{viewingPlan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-900">{viewingPlan.description || 'No description'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        viewingPlan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingPlan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <p className="text-gray-900">{new Date(viewingPlan.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-500 mr-2" />
                    Pricing
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Price</label>
                      <p className="text-2xl font-bold text-gray-900">
                        {viewingPlan.price} {viewingPlan.currency}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Billing Interval</label>
                      <p className="text-gray-900 capitalize">{viewingPlan.interval}</p>
                    </div>
                    {viewingPlan.interval === 'year' && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Monthly Equivalent</label>
                        <p className="text-gray-900">
                          ${(parseFloat(viewingPlan.price) / 12).toFixed(2)}/month
                        </p>
                      </div>
                    )}
                    {viewingPlan.trial_days > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Trial Period</label>
                        <p className="text-gray-900">{viewingPlan.trial_days} days</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Features and Limits */}
              <div className="space-y-6">
                {/* Features */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckIcon className="h-5 w-5 text-purple-500 mr-2" />
                    Features
                  </h3>
                  {viewingPlan.features && Array.isArray(viewingPlan.features) && viewingPlan.features.length > 0 ? (
                    <div className="space-y-2">
                      {viewingPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-900">{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No features defined</p>
                  )}
                </div>

                {/* Limits */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                    Limits
                  </h3>
                  {viewingPlan.limits && typeof viewingPlan.limits === 'object' && Object.keys(viewingPlan.limits).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(viewingPlan.limits).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-gray-900 font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No limits defined</p>
                  )}
                </div>

                {/* Usage Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UsersIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Usage Statistics
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subscribers</label>
                      <p className="text-2xl font-bold text-gray-900">{viewingPlan.subscription_count || 0}</p>
                    </div>
                    {viewingPlan.provider_price_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Provider Price ID</label>
                        <p className="text-gray-900 font-mono text-sm">{viewingPlan.provider_price_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingPlan(null)}
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

export default AdminPlans;


