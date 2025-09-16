import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  getUserProfileSettings, 
  updateUserProfileSettings, 
  updateUserProfile,
  changePassword,
  uploadAvatar,
  getSupportedCurrencies,
  getCurrentUser
} from '../services/userService';
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Save, 
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Profile Settings State
  const [profileSettings, setProfileSettings] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_website: '',
    header_custom_text: '',
    show_logo_in_header: true,
    show_contact_in_header: true,
    show_address_in_header: true,
    default_currency: 'KES',
    default_tax_rate: 16.00,
    default_payment_terms: 30,
    invoice_number_prefix: 'INV',
    invoice_number_start: 1000,
    email_notifications: true,
    invoice_reminders: true,
    payment_confirmations: true,
    overdue_alerts: true
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    website: user?.website || '',
    bio: user?.bio || '',
    jobTitle: user?.job_title || '',
    department: user?.department || '',
    employeeId: user?.employee_id || '',
    dateOfBirth: user?.date_of_birth || '',
    nationality: user?.nationality || '',
    emergencyContact: user?.emergency_contact || '',
    emergencyPhone: user?.emergency_phone || ''
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Currencies State
  const [, setCurrencies] = useState([]);

  const loadSettingsData = useCallback(async () => {
    try {
      setInitialLoading(true);
      
      // Load profile settings
      try {
        const settingsData = await getUserProfileSettings();
        setProfileSettings(settingsData);
      } catch (error) {
        console.log('Profile settings not available yet:', error.message);
      }

      // Load user profile data
      if (user) {
        setUserProfile({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          website: user.website || '',
          bio: user.bio || '',
          jobTitle: user.job_title || '',
          department: user.department || '',
          employeeId: user.employee_id || '',
          dateOfBirth: user.date_of_birth || '',
          nationality: user.nationality || '',
          emergencyContact: user.emergency_contact || '',
          emergencyPhone: user.emergency_phone || ''
        });
      }

      // Load supported currencies
      try {
        const currenciesData = await getSupportedCurrencies();
        setCurrencies(currenciesData);
      } catch (error) {
        console.log('Currencies not available yet:', error.message);
        // Set default currencies
        setCurrencies([
          { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
          { code: 'USD', name: 'US Dollar', symbol: '$' },
          { code: 'EUR', name: 'Euro', symbol: '€' },
          { code: 'GBP', name: 'British Pound', symbol: '£' }
        ]);
      }

    } catch (error) {
      console.error('Error loading settings data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const handleProfileSettingsSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateUserProfileSettings(profileSettings);
      setProfileSettings(result);
      toast.success('Profile settings updated successfully');
    } catch (error) {
      console.error('Profile settings save error:', error);
      toast.error(error.message || 'Failed to update profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUserProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = {
        first_name: userProfile.firstName,
        last_name: userProfile.lastName,
        email: userProfile.email,
        phone: userProfile.phone,
        website: userProfile.website,
        bio: userProfile.bio,
        job_title: userProfile.jobTitle,
        department: userProfile.department,
        employee_id: userProfile.employeeId,
        date_of_birth: userProfile.dateOfBirth || null,
        nationality: userProfile.nationality,
        emergency_contact: userProfile.emergencyContact,
        emergency_phone: userProfile.emergencyPhone
      };

      const result = await updateUserProfile(updateData);
      
      // Update the user context
      updateUser({
        ...user,
        ...result
      });
      
      toast.success('User profile updated successfully');
    } catch (error) {
      console.error('User profile save error:', error);
      toast.error(error.message || 'Failed to update user profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    try {
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });
      
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        await uploadAvatar(file);
        toast.success('Avatar uploaded successfully');
        // Reload user data to get updated avatar
        const updatedUser = await getCurrentUser();
        updateUser(updatedUser);
      } catch (error) {
        toast.error(error.message || 'Failed to upload avatar');
      } finally {
        setLoading(false);
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">User Profile</h3>
                  <form onSubmit={handleUserProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={userProfile.firstName}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={userProfile.lastName}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={userProfile.website}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={userProfile.jobTitle}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={userProfile.bio}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading} icon={Save}>Save Profile</Button>
                    </div>
                  </form>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading} icon={Save}>Change Password</Button>
                    </div>
                  </form>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Avatar</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2">
                        <Upload size={16} />
                        <span>Upload Avatar</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                <form onSubmit={handleProfileSettingsSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={profileSettings.company_name}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Email
                      </label>
                      <input
                        type="email"
                        value={profileSettings.company_email}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, company_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Phone
                      </label>
                      <input
                        type="tel"
                        value={profileSettings.company_phone}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, company_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Website
                      </label>
                      <input
                        type="url"
                        value={profileSettings.company_website}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, company_website: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Address
                    </label>
                    <textarea
                      value={profileSettings.company_address}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, company_address: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header Custom Text
                    </label>
                    <textarea
                      value={profileSettings.header_custom_text}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, header_custom_text: e.target.value }))}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom text to display in invoice header"
                    />
                  </div>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.show_logo_in_header}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, show_logo_in_header: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Show Logo in Header</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.show_contact_in_header}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, show_contact_in_header: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Show Contact Info</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.show_address_in_header}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, show_address_in_header: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Show Address</span>
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} icon={Save}>Save Business Info</Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <form onSubmit={handleProfileSettingsSave} className="space-y-4">
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.email_notifications}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.invoice_reminders}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, invoice_reminders: e.target.checked }))}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Invoice Reminders</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.payment_confirmations}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, payment_confirmations: e.target.checked }))}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Payment Confirmations</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileSettings.overdue_alerts}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, overdue_alerts: e.target.checked }))}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Overdue Alerts</span>
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} icon={Save}>Save Notifications</Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Security Features
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Additional security features will be available in future updates.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Settings;