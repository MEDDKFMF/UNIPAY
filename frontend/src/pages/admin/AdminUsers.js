import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EllipsisVerticalIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { checkFeatureAccess, getUserLimits } from '../../utils/featureAccess';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [sortBy, setSortBy] = useState('date_joined');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('access_token');
        
        // Load both users and statistics
        const [usersResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/auth/admin/users/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/payments/admin/metrics/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        setUserStats(statsResponse.data);
      } catch (error) {
        console.error('Error loading users:', error);
        setError(error.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter, search, and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && user.is_active) ||
                           (filterStatus === 'inactive' && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'date_joined' || sortBy === 'last_login') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'activate':
            return axios.patch(`http://localhost:8000/api/auth/admin/users/${userId}/`, 
              { is_active: true }, 
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
          case 'deactivate':
            return axios.patch(`http://localhost:8000/api/auth/admin/users/${userId}/`, 
              { is_active: false }, 
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
          case 'delete':
            return axios.delete(`http://localhost:8000/api/auth/admin/users/${userId}/`, 
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
          default:
            return Promise.resolve();
        }
      });
      
      await Promise.all(promises);
      setSelectedUsers([]);
      setShowBulkActions(false);
      // Reload users
      window.location.reload();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:8000/api/auth/admin/users/${userId}/`, userData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Reload users
      window.location.reload();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const toggleUserActiveDirect = async (user) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(
        `http://localhost:8000/api/auth/admin/users/${user.id}/`,
        { is_active: !user.is_active },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (error) {
      console.error('Error toggling user active state:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`http://localhost:8000/api/auth/admin/users/${userId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Reload users
        window.location.reload();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading users: {error}</p>
          <button 
            onClick={() => window.location.reload()}
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* User Statistics */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total_users || 0}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-blue-600">
              {users.filter(u => u.is_active).length} active
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Users (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.new_users_30d || 0}</p>
              </div>
              <UserPlusIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-green-600">
              {userStats.user_growth_rate || 0}% growth rate
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.active_subscriptions || 0}</p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 text-sm text-purple-600">
              {userStats.total_users > 0 ? Math.round((userStats.active_subscriptions / userStats.total_users) * 100) : 0}% conversion
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Platform Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'platform_admin').length}
                </p>
              </div>
              <ShieldCheckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 text-sm text-orange-600">
              System administrators
            </div>
          </div>
        </div>
      )}

      {/* Advanced Controls */}
      <div className="bg-white rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="platform_admin">Platform Admin</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
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
              <option value="date_joined">Join Date</option>
              <option value="last_login">Last Login</option>
              <option value="username">Username</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
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
        
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center"
          >
            <EllipsisVerticalIcon className="h-5 w-5 mr-2" />
            Bulk Actions
          </button>
          <div className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select All ({filteredUsers.length})
                  </span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedUsers.length} users selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={selectedUsers.length === 0}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={selectedUsers.length === 0}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={selectedUsers.length === 0}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({filteredUsers.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3 font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length}
                  onChange={selectAllUsers}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-3 font-medium text-gray-700">User</th>
              <th className="p-3 font-medium text-gray-700">Role</th>
              <th className="p-3 font-medium text-gray-700">Plan</th>
              <th className="p-3 font-medium text-gray-700">Features</th>
              <th className="p-3 font-medium text-gray-700">Status</th>
              <th className="p-3 font-medium text-gray-700">Created</th>
              <th className="p-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'platform_admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'accountant' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3">
                  {user.subscription?.plan?.name ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.subscription.plan.name}</div>
                      <div className="text-gray-500">{user.subscription.plan.price} {user.subscription.plan.currency}/{user.subscription.plan.interval}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No plan</span>
                  )}
                </td>
                <td className="p-3">
                  {user.subscription?.plan ? (
                    <div className="space-y-1">
                      {/* Show plan features */}
                      <div className="text-xs font-medium text-gray-900 mb-2">Plan Features:</div>
                      {user.subscription.plan.features && Array.isArray(user.subscription.plan.features) ? (
                        user.subscription.plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No features</span>
                      )}
                      
                      {/* Show actual access status */}
                      <div className="text-xs font-medium text-gray-900 mt-3 mb-2">Access Status:</div>
                      <div className="space-y-1">
                        <div className={`flex items-center text-xs ${checkFeatureAccess(user, 'Unlimited invoices') ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${checkFeatureAccess(user, 'Unlimited invoices') ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          Invoice Limit: {getUserLimits(user).invoices_per_month || 'Unlimited'}
                        </div>
                        <div className={`flex items-center text-xs ${checkFeatureAccess(user, 'Priority support') ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${checkFeatureAccess(user, 'Priority support') ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          Priority Support: {checkFeatureAccess(user, 'Priority support') ? 'Yes' : 'No'}
                        </div>
                        <div className={`flex items-center text-xs ${checkFeatureAccess(user, 'API access') ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${checkFeatureAccess(user, 'API access') ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          API Access: {checkFeatureAccess(user, 'API access') ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No plan</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">{new Date(user.date_joined).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingUser(user)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit User"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleUserActiveDirect(user)}
                      className={`p-1 rounded ${
                        user.is_active 
                          ? 'text-yellow-600 hover:bg-yellow-100' 
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <XMarkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete User"
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User: {editingUser.username}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="client">Client</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                    <option value="platform_admin">Platform Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingUser.is_active}
                    onChange={(e) => setEditingUser({...editingUser, is_active: e.target.value === 'true'})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingUser) {
                      updateUser(editingUser.id, {
                        role: editingUser.role,
                        is_active: editingUser.is_active
                      });
                    }
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
