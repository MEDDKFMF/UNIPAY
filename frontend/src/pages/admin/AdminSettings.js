import React, { useEffect, useState } from 'react';
import logger from '../../utils/logger';
import api from '../../services/api';
import { 
  ShieldCheckIcon, 
  GlobeAltIcon, 
  CreditCardIcon,
  BellIcon,
  CircleStackIcon,
  ServerIcon,
  KeyIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    platform: {
      platform_name: 'Invoice Platform',
      platform_domain: 'localhost:3000',
      support_email: 'support@example.com',
      admin_email: 'admin@example.com',
      timezone: 'UTC',
      language: 'en',
      maintenance_mode: false,
      registration_enabled: true,
      max_users_per_org: 100,
      max_invoices_per_month: 1000
    },
    security: {
      require_email_verification: true,
      require_two_factor: false,
      session_timeout: 24,
      password_min_length: 8,
      password_require_special: true,
      login_attempts: 5,
      lockout_duration: 30,
      api_rate_limit: 1000,
      cors_origins: ['http://localhost:3000']
    },
    billing: {
      default_currency: 'USD',
      default_tax_rate: 0.0,
      grace_period: 7,
      invoice_prefix: 'INV',
      invoice_start_number: 1000,
      payment_terms: 30,
      late_fee_rate: 0.05,
      stripe_publishable_key: '',
      stripe_secret_key: '',
      webhook_secret: ''
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_use_tls: true,
      from_email: 'noreply@example.com',
      from_name: 'Invoice Platform',
      email_notifications: true,
      invoice_reminders: true,
      payment_confirmations: true,
      overdue_alerts: true
    },
    system: {
      backup_enabled: true,
      backup_frequency: 'daily',
      backup_retention: 30,
      log_level: 'INFO',
      debug_mode: false,
      cache_enabled: true,
      cache_timeout: 3600,
      file_upload_limit: 10,
      database_optimization: true
    }
  });

  const tabs = [
    { id: 'platform', name: 'Platform', icon: GlobeAltIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'system', name: 'System', icon: ServerIcon }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load platform settings
      const response = await api.get('/api/settings/platform/');
      
      if (response.data) {
        // Map backend data to frontend structure
        const backendData = response.data;
        setSettings(prev => ({
          platform: {
            platform_name: backendData.platform_name || prev.platform.platform_name,
            platform_domain: backendData.platform_domain || prev.platform.platform_domain,
            support_email: backendData.support_email || prev.platform.support_email,
            admin_email: backendData.admin_email || prev.platform.admin_email,
            timezone: backendData.timezone || prev.platform.timezone,
            language: backendData.language || prev.platform.language,
            maintenance_mode: backendData.maintenance_mode || prev.platform.maintenance_mode,
            registration_enabled: backendData.registration_enabled || prev.platform.registration_enabled,
            max_users_per_org: backendData.max_users_per_org || prev.platform.max_users_per_org,
            max_invoices_per_month: backendData.max_invoices_per_month || prev.platform.max_invoices_per_month
          },
          security: {
            require_email_verification: backendData.require_email_verification || prev.security.require_email_verification,
            require_two_factor: backendData.require_two_factor || prev.security.require_two_factor,
            session_timeout: backendData.session_timeout || prev.security.session_timeout,
            password_min_length: backendData.password_min_length || prev.security.password_min_length,
            password_require_special: backendData.password_require_special || prev.security.password_require_special,
            login_attempts: backendData.login_attempts || prev.security.login_attempts,
            lockout_duration: backendData.lockout_duration || prev.security.lockout_duration,
            api_rate_limit: backendData.api_rate_limit || prev.security.api_rate_limit,
            cors_origins: backendData.cors_origins || prev.security.cors_origins
          },
          billing: {
            default_currency: backendData.default_currency || prev.billing.default_currency,
            default_tax_rate: backendData.default_tax_rate || prev.billing.default_tax_rate,
            grace_period: backendData.grace_period || prev.billing.grace_period,
            invoice_prefix: backendData.invoice_prefix || prev.billing.invoice_prefix,
            invoice_start_number: backendData.invoice_start_number || prev.billing.invoice_start_number,
            payment_terms: backendData.payment_terms || prev.billing.payment_terms,
            late_fee_rate: backendData.late_fee_rate || prev.billing.late_fee_rate,
            stripe_publishable_key: backendData.stripe_publishable_key || prev.billing.stripe_publishable_key,
            stripe_secret_key: backendData.stripe_secret_key || prev.billing.stripe_secret_key,
            webhook_secret: backendData.webhook_secret || prev.billing.webhook_secret
          },
          email: {
            smtp_host: backendData.smtp_host || prev.email.smtp_host,
            smtp_port: backendData.smtp_port || prev.email.smtp_port,
            smtp_username: backendData.smtp_username || prev.email.smtp_username,
            smtp_password: backendData.smtp_password || prev.email.smtp_password,
            smtp_use_tls: backendData.smtp_use_tls || prev.email.smtp_use_tls,
            from_email: backendData.from_email || prev.email.from_email,
            from_name: backendData.from_name || prev.email.from_name,
            email_notifications: backendData.email_notifications || prev.email.email_notifications,
            invoice_reminders: backendData.invoice_reminders || prev.email.invoice_reminders,
            payment_confirmations: backendData.payment_confirmations || prev.email.payment_confirmations,
            overdue_alerts: backendData.overdue_alerts || prev.email.overdue_alerts
          },
          system: {
            backup_enabled: backendData.backup_enabled || prev.system.backup_enabled,
            backup_frequency: backendData.backup_frequency || prev.system.backup_frequency,
            backup_retention: backendData.backup_retention || prev.system.backup_retention,
            log_level: backendData.log_level || prev.system.log_level,
            debug_mode: backendData.debug_mode || prev.system.debug_mode,
            cache_enabled: backendData.cache_enabled || prev.system.cache_enabled,
            cache_timeout: backendData.cache_timeout || prev.system.cache_timeout,
            file_upload_limit: backendData.file_upload_limit || prev.system.file_upload_limit,
            database_optimization: backendData.database_optimization || prev.system.database_optimization
          }
        }));
      }
    } catch (error) {
  logger.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      
      // Map frontend settings to backend format
      const backendData = {
        // Platform settings
        platform_name: settings.platform.name,
        platform_domain: settings.platform.domain,
        support_email: settings.platform.supportEmail,
        admin_email: settings.platform.adminEmail,
        timezone: settings.platform.timezone,
        language: settings.platform.language,
        maintenance_mode: settings.platform.maintenanceMode,
        registration_enabled: settings.platform.registrationEnabled,
        max_users_per_org: settings.platform.maxUsersPerOrg,
        max_invoices_per_month: settings.platform.maxInvoicesPerMonth,
        
        // Security settings
        require_email_verification: settings.security.requireEmailVerification,
        require_two_factor: settings.security.requireTwoFactor,
        session_timeout: settings.security.sessionTimeout,
        password_min_length: settings.security.passwordMinLength,
        password_require_special: settings.security.passwordRequireSpecial,
        login_attempts: settings.security.loginAttempts,
        lockout_duration: settings.security.lockoutDuration,
        api_rate_limit: settings.security.apiRateLimit,
        cors_origins: settings.security.corsOrigins,
        
        // Billing settings
        default_currency: settings.billing.currency,
        default_tax_rate: settings.billing.taxRate,
        grace_period: settings.billing.gracePeriod,
        invoice_prefix: settings.billing.invoicePrefix,
        invoice_start_number: settings.billing.invoiceStartNumber,
        payment_terms: settings.billing.paymentTerms,
        late_fee_rate: settings.billing.lateFeeRate,
        stripe_publishable_key: settings.billing.stripePublishableKey,
        stripe_secret_key: settings.billing.stripeSecretKey,
        webhook_secret: settings.billing.webhookSecret,
        
        // Email settings
        smtp_host: settings.email.smtpHost,
        smtp_port: settings.email.smtpPort,
        smtp_username: settings.email.smtpUsername,
        smtp_password: settings.email.smtpPassword,
        smtp_use_tls: settings.email.smtpUseTls,
        from_email: settings.email.fromEmail,
        from_name: settings.email.fromName,
        email_notifications: settings.email.emailNotifications,
        invoice_reminders: settings.email.invoiceReminders,
        payment_confirmations: settings.email.paymentConfirmations,
        overdue_alerts: settings.email.overdueAlerts,
        
        // System settings
        backup_enabled: settings.system.backupEnabled,
        backup_frequency: settings.system.backupFrequency,
        backup_retention: settings.system.backupRetention,
        log_level: settings.system.logLevel,
        debug_mode: settings.system.debugMode,
        cache_enabled: settings.system.cacheEnabled,
        cache_timeout: settings.system.cacheTimeout,
        file_upload_limit: settings.system.fileUploadLimit,
        database_optimization: settings.system.databaseOptimization
      };
      
      // Save platform settings
      await api.put('/api/settings/platform/update/', backendData);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
  logger.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      
      await api.post('/api/settings/test-email/', { email: settings.email.fromEmail });
      alert('Test email sent successfully!');
    } catch (error) {
  logger.error('Error sending test email:', error);
      alert('Failed to send test email');
    }
  };



  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSettings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Platform Settings */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <GlobeAltIcon className="h-5 w-5 text-blue-500 inline mr-2" />
                Platform Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                  <input
                    type="text"
                    value={settings.platform.platform_name}
                    onChange={(e) => handleSettingChange('platform', 'platform_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <input
                    type="text"
                    value={settings.platform.platform_domain}
                    onChange={(e) => handleSettingChange('platform', 'platform_domain', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settings.platform.support_email}
                    onChange={(e) => handleSettingChange('platform', 'support_email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={settings.platform.admin_email}
                    onChange={(e) => handleSettingChange('platform', 'admin_email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={settings.platform.timezone}
                    onChange={(e) => handleSettingChange('platform', 'timezone', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={settings.platform.language}
                    onChange={(e) => handleSettingChange('platform', 'language', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <UserGroupIcon className="h-5 w-5 text-green-500 inline mr-2" />
                User Limits & Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Users per Organization</label>
                  <input
                    type="number"
                    value={settings.platform.maxUsersPerOrg}
                    onChange={(e) => handleSettingChange('platform', 'maxUsersPerOrg', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Invoices per Month</label>
                  <input
                    type="number"
                    value={settings.platform.maxInvoicesPerMonth}
                    onChange={(e) => handleSettingChange('platform', 'maxInvoicesPerMonth', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.platform.registrationEnabled}
                    onChange={(e) => handleSettingChange('platform', 'registrationEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Enable User Registration</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.platform.maintenanceMode}
                    onChange={(e) => handleSettingChange('platform', 'maintenanceMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Maintenance Mode</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <ShieldCheckIcon className="h-5 w-5 text-red-500 inline mr-2" />
                Authentication & Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.requireEmailVerification}
                    onChange={(e) => handleSettingChange('security', 'requireEmailVerification', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Require Email Verification</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.requireTwoFactor}
                    onChange={(e) => handleSettingChange('security', 'requireTwoFactor', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Require Two-Factor Authentication</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (hours)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Min Length</label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireSpecial}
                    onChange={(e) => handleSettingChange('security', 'passwordRequireSpecial', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Require Special Characters in Password</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security.loginAttempts}
                    onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    value={settings.security.apiRateLimit}
                    onChange={(e) => handleSettingChange('security', 'apiRateLimit', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Settings */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <CreditCardIcon className="h-5 w-5 text-purple-500 inline mr-2" />
                Payment & Billing Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                  <select
                    value={settings.billing.currency}
                    onChange={(e) => handleSettingChange('billing', 'currency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.billing.taxRate}
                    onChange={(e) => handleSettingChange('billing', 'taxRate', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (days)</label>
                  <input
                    type="number"
                    value={settings.billing.gracePeriod}
                    onChange={(e) => handleSettingChange('billing', 'gracePeriod', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
                  <input
                    type="number"
                    value={settings.billing.paymentTerms}
                    onChange={(e) => handleSettingChange('billing', 'paymentTerms', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.billing.lateFeeRate}
                    onChange={(e) => handleSettingChange('billing', 'lateFeeRate', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.billing.invoicePrefix}
                    onChange={(e) => handleSettingChange('billing', 'invoicePrefix', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Start Number</label>
                  <input
                    type="number"
                    value={settings.billing.invoiceStartNumber}
                    onChange={(e) => handleSettingChange('billing', 'invoiceStartNumber', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <KeyIcon className="h-5 w-5 text-yellow-500 inline mr-2" />
                Stripe Configuration
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Publishable Key</label>
                  <input
                    type="text"
                    value={settings.billing.stripePublishableKey}
                    onChange={(e) => handleSettingChange('billing', 'stripePublishableKey', e.target.value)}
                    placeholder="pk_test_..."
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Secret Key</label>
                  <input
                    type="password"
                    value={settings.billing.stripeSecretKey}
                    onChange={(e) => handleSettingChange('billing', 'stripeSecretKey', e.target.value)}
                    placeholder="sk_test_..."
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                  <input
                    type="password"
                    value={settings.billing.webhookSecret}
                    onChange={(e) => handleSettingChange('billing', 'webhookSecret', e.target.value)}
                    placeholder="whsec_..."
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <EnvelopeIcon className="h-5 w-5 text-blue-500 inline mr-2" />
                SMTP Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.email.smtpHost}
                    onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input
                    type="email"
                    value={settings.email.smtpUsername}
                    onChange={(e) => handleSettingChange('email', 'smtpUsername', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                  <input
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                  <input
                    type="text"
                    value={settings.email.fromName}
                    onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.email.smtpUseTls}
                    onChange={(e) => handleSettingChange('email', 'smtpUseTls', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Use TLS</label>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={testEmailSettings}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Test Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <BellIcon className="h-5 w-5 text-green-500 inline mr-2" />
                Notification Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.email.emailNotifications}
                    onChange={(e) => handleSettingChange('email', 'emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Enable Email Notifications</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.email.invoiceReminders}
                    onChange={(e) => handleSettingChange('email', 'invoiceReminders', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Invoice Reminders</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.email.paymentConfirmations}
                    onChange={(e) => handleSettingChange('email', 'paymentConfirmations', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Payment Confirmations</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.email.overdueAlerts}
                    onChange={(e) => handleSettingChange('email', 'overdueAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Overdue Alerts</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <CircleStackIcon className="h-5 w-5 text-indigo-500 inline mr-2" />
                Backup & Maintenance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.system.backupEnabled}
                    onChange={(e) => handleSettingChange('system', 'backupEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Enable Automatic Backups</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                  <select
                    value={settings.system.backupFrequency}
                    onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Retention (days)</label>
                  <input
                    type="number"
                    value={settings.system.backupRetention}
                    onChange={(e) => handleSettingChange('system', 'backupRetention', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Log Level</label>
                  <select
                    value={settings.system.logLevel}
                    onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.system.debugMode}
                    onChange={(e) => handleSettingChange('system', 'debugMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Debug Mode</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.system.cacheEnabled}
                    onChange={(e) => handleSettingChange('system', 'cacheEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Enable Caching</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cache Timeout (seconds)</label>
                  <input
                    type="number"
                    value={settings.system.cacheTimeout}
                    onChange={(e) => handleSettingChange('system', 'cacheTimeout', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Upload Limit (MB)</label>
                  <input
                    type="number"
                    value={settings.system.fileUploadLimit}
                    onChange={(e) => handleSettingChange('system', 'fileUploadLimit', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.system.databaseOptimization}
                    onChange={(e) => handleSettingChange('system', 'databaseOptimization', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Database Optimization</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;