import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Globe, 
  Clock, 
  X, 
  Eye, 
  Ban,
  RefreshCw,
  Activity,
  Zap,
  MapPin,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sessionMonitoringService } from '../../services/sessionMonitoringService';

const RealTimeSessionMonitor = () => {
  const [sessions, setSessions] = useState({
    active: [],
    suspicious: [],
    security_alerts: []
  });
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSessionData = useCallback(async () => {
    try {
      const data = await sessionMonitoringService.getRealTimeSessions();
      console.log('RealTimeSessionMonitor - Raw API response:', data);
      console.log('Active sessions:', data.active_sessions);
      console.log('Suspicious sessions:', data.suspicious_sessions);
      console.log('Statistics:', data.statistics);
      
      setSessions({
        active: data.active_sessions || [],
        suspicious: data.suspicious_sessions || [],
        security_alerts: data.security_alerts || []
      });
      setStatistics(data.statistics || {});
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSessionData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const terminateSession = async (sessionId, reason = 'Terminated by admin') => {
    try {
      await sessionMonitoringService.terminateSession(sessionId, reason);
      toast.success('Session terminated successfully');
      fetchSessionData(); // Refresh data
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const SessionCard = ({ session, isSuspicious = false }) => (
    <div className={`p-4 rounded-lg border ${
      isSuspicious 
        ? 'bg-red-50 border-red-200 hover:bg-red-100' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    } transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSuspicious ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {getDeviceIcon(session.device_type)}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{session.user.username}</h4>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            isSuspicious ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {isSuspicious ? 'Suspicious' : 'Active'}
          </span>
          <button
            onClick={() => {
              setSelectedSession(session);
              setShowDetails(true);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => terminateSession(session.id)}
            className="p-1 text-red-400 hover:text-red-600"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{session.ip_address}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{formatTimeAgo(session.last_activity)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{session.location || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{session.browser || 'Unknown'}</span>
        </div>
      </div>
      
      {isSuspicious && session.termination_reason && (
        <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-800">
          <strong>Alert:</strong> {session.termination_reason}
        </div>
      )}
    </div>
  );

  const SecurityAlertCard = ({ alert }) => (
    <div className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h4 className="font-medium">{alert.title}</h4>
            <p className="text-sm mt-1">{alert.message}</p>
            <p className="text-xs mt-2 text-gray-500">
              {formatTimeAgo(alert.created_at)}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          alert.priority === 'high' ? 'bg-red-200 text-red-800' : 
          alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 
          'bg-green-200 text-green-800'
        }`}>
          {alert.priority}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Real-Time Session Monitor
          </h2>
          <p className="text-gray-600">Monitor active sessions and security alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
          </button>
          <button
            onClick={fetchSessionData}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_active || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Suspicious</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_suspicious || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Security Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.security_alerts_count || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Globe className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Unique IPs Today</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.unique_ips_today || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {sessions.security_alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Recent Security Alerts
          </h3>
          <div className="space-y-3">
            {sessions.security_alerts.slice(0, 5).map((alert) => (
              <SecurityAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Suspicious Sessions */}
      {sessions.suspicious.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Suspicious Sessions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sessions.suspicious.map((session) => (
              <SessionCard key={session.id} session={session} isSuspicious={true} />
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Active Sessions ({sessions.active.length})
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessions.active.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </div>

      {/* Session Details Modal */}
      {showDetails && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Session Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="text-gray-900">{selectedSession.user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedSession.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">IP Address</label>
                  <p className="text-gray-900">{selectedSession.ip_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{selectedSession.location || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Device</label>
                  <p className="text-gray-900">{selectedSession.device_type || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Browser</label>
                  <p className="text-gray-900">{selectedSession.browser || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">OS</label>
                  <p className="text-gray-900">{selectedSession.os || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Activity</label>
                  <p className="text-gray-900">{formatTimeAgo(selectedSession.last_activity)}</p>
                </div>
              </div>
              
              {selectedSession.termination_reason && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Termination Reason</label>
                  <p className="text-red-600 bg-red-50 p-2 rounded">{selectedSession.termination_reason}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  terminateSession(selectedSession.id);
                  setShowDetails(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeSessionMonitor;
