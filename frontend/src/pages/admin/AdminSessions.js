import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
  UserIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  MapPinIcon,
  WifiIcon,
  CalendarIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  ChartBarIcon,
  UsersIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import RealTimeSessionMonitor from '../../components/admin/RealTimeSessionMonitor';

const AdminSessions = () => {
  const [activeTab, setActiveTab] = useState('realtime');
  const [sessions, setSessions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    device_type: '',
    search: '',
    user_role: 'all',
    time_range: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingSession, setViewingSession] = useState(null);
  const [sortBy, setSortBy] = useState('last_activity');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadSessions();
    loadMetrics();
  }, [currentPage, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams({
        page: currentPage,
        ...filters
      });
      
      const response = await axios.get(`http://localhost:8000/api/auth/admin/sessions/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSessions(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/auth/admin/sessions/metrics/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleBulkAction = async (action, reason = '') => {
    try {
      if (selectedSessions.length === 0) return;
      
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:8000/api/auth/admin/sessions/bulk-action/', {
        session_ids: selectedSessions,
        action,
        reason
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Refresh data
      loadSessions();
      loadMetrics();
      setSelectedSessions([]);
      setShowBulkActions(false);
      
      // Show success message
      alert(response.data.message);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action');
    }
  };

  const terminateSession = async (sessionId, reason = '') => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8000/api/auth/admin/sessions/terminate/', {
        session_ids: [sessionId],
        reason: reason || 'Admin terminated'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      loadSessions();
      loadMetrics();
      alert('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      alert('Failed to terminate session');
    }
  };

  const toggleSessionSelection = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const selectAllSessions = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(s => s.id));
    }
  };

  const getSessionDetails = async (sessionId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8000/api/auth/admin/sessions/${sessionId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setViewingSession(response.data);
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const formatDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'terminated':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'suspicious':
        return <ShieldExclamationIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'desktop':
        return <ComputerDesktopIcon className="h-4 w-4" />;
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'tablet':
        return <DeviceTabletIcon className="h-4 w-4" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800',
      suspicious: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading && !sessions.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Monitoring</h1>
          <p className="text-gray-600">Monitor active user sessions and security</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Monitoring</h1>
          <p className="text-gray-600">Monitor active user sessions and security</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              loadSessions();
              loadMetrics();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => handleBulkAction('terminate_all_inactive')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Clean Inactive
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'realtime'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Real-Time Monitor
            </div>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-2" />
              Session List
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'realtime' ? (
        <RealTimeSessionMonitor />
      ) : (
        <div className="space-y-8">

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">{metrics.active_sessions}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.total_sessions}</p>
              </div>
              <UserIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspicious</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.suspicious_sessions}</p>
              </div>
              <ShieldExclamationIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 24h</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.recent_sessions_24h}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters and Controls */}
      <div className="bg-white rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, IPs, locations..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
            <select
              value={filters.device_type}
              onChange={(e) => setFilters(prev => ({ ...prev, device_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <select
              value={filters.user_role}
              onChange={(e) => setFilters(prev => ({ ...prev, user_role: e.target.value }))}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={filters.time_range}
              onChange={(e) => setFilters(prev => ({ ...prev, time_range: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last_activity">Last Activity</option>
              <option value="created_at">Created At</option>
              <option value="user_username">Username</option>
              <option value="ip_address">IP Address</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Bulk Actions ({selectedSessions.length})
          </button>
          <div className="text-sm text-gray-500">
            Showing {sessions.length} sessions
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center space-x-3">
              <button
                onClick={() => handleBulkAction('terminate')}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-4 w-4 inline mr-2" />
                Terminate Selected
              </button>
              
              <button
                onClick={() => handleBulkAction('mark_suspicious')}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <ShieldExclamationIcon className="h-4 w-4 inline mr-2" />
                Mark Suspicious
              </button>
              
              <button
                onClick={() => handleBulkAction('mark_expired')}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <ClockIcon className="h-4 w-4 inline mr-2" />
                Mark Expired
              </button>
              
              <button
                onClick={() => handleBulkAction('refresh')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <EyeIcon className="h-4 w-4 inline mr-2" />
                Refresh Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSessions.length === sessions.length && sessions.length > 0}
                    onChange={selectAllSessions}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {session.user_username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {session.user_username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.user_email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {session.user_role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(session.device_type)}
                      <div>
                        <div className="text-sm text-gray-900">{session.device_type}</div>
                        <div className="text-xs text-gray-500">{session.browser} / {session.os}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{session.location_display}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(session.status)}
                      {getStatusBadge(session.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.last_activity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.duration_formatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => getSessionDetails(session.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Terminate Session"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleBulkAction('mark_suspicious', '', [session.id])}
                        className="text-orange-600 hover:text-orange-900"
                        title="Mark as Suspicious"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Session Details Modal */}
      {viewingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
              <button
                onClick={() => setViewingSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  User Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Username</label>
                    <p className="text-gray-900">{viewingSession.user_username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{viewingSession.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      viewingSession.user_role === 'platform_admin' ? 'bg-purple-100 text-purple-800' :
                      viewingSession.user_role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      viewingSession.user_role === 'accountant' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingSession.user_role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Session Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(viewingSession.status)}
                      {getStatusBadge(viewingSession.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-gray-900">{new Date(viewingSession.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Activity</label>
                    <p className="text-gray-900">{new Date(viewingSession.last_activity).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-gray-900">{formatDuration(viewingSession.created_at, viewingSession.last_activity)}</p>
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  {getDeviceIcon(viewingSession.device_type)}
                  <span className="ml-2">Device Information</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Device Type</label>
                    <p className="text-gray-900 capitalize">{viewingSession.device_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Operating System</label>
                    <p className="text-gray-900">{viewingSession.os}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Browser</label>
                    <p className="text-gray-900">{viewingSession.browser}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">User Agent</label>
                    <p className="text-gray-900 text-xs break-all">{viewingSession.user_agent}</p>
                  </div>
                </div>
              </div>

              {/* Network Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <WifiIcon className="h-5 w-5 mr-2" />
                  Network Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">IP Address</label>
                    <p className="text-gray-900 font-mono">{viewingSession.ip_address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{viewingSession.location_display}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Country</label>
                    <p className="text-gray-900">{viewingSession.country || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">City</label>
                    <p className="text-gray-900">{viewingSession.city || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setViewingSession(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  terminateSession(viewingSession.id);
                  setViewingSession(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default AdminSessions;
