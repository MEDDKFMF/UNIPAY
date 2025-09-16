import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Save, X, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInvoiceHeaderData, updateUserProfileSettings } from '../services/userService';
import { toast } from 'react-hot-toast';

const InvoiceHeader = ({ isEditable = false, onHeaderUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [headerData, setHeaderData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_website: '',
    company_logo: '',
    header_custom_text: '',
    show_logo: true,
    show_contact: true,
    show_address: true
  });

  const loadHeaderData = useCallback(async () => {
    try {
      const data = await getInvoiceHeaderData();
      setHeaderData(data);
    } catch (error) {
      console.error('Error loading header data:', error);
      // Fallback to user data
      setHeaderData({
        company_name: user?.company_name || '',
        company_email: user?.email || '',
        company_phone: user?.phone || '',
        company_address: user?.address || '',
        company_website: user?.website || '',
        company_logo: user?.avatar_url || '',
        header_custom_text: '',
        show_logo: true,
        show_contact: true,
        show_address: true
      });
    }
  }, [user]);

  useEffect(() => {
    loadHeaderData();
  }, [loadHeaderData]);

  const handleInputChange = (field, value) => {
    setHeaderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        company_name: headerData.company_name,
        company_email: headerData.company_email,
        company_phone: headerData.company_phone,
        company_address: headerData.company_address,
        company_website: headerData.company_website,
        header_custom_text: headerData.header_custom_text,
        show_logo_in_header: headerData.show_logo,
        show_contact_in_header: headerData.show_contact,
        show_address_in_header: headerData.show_address
      };

      await updateUserProfileSettings(updateData);
      
      if (onHeaderUpdate) {
        onHeaderUpdate(headerData);
      }

      setIsEditing(false);
      toast.success('Header updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update header');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loadHeaderData();
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Customize Invoice Header</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 disabled:opacity-50 flex items-center space-x-1"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company/Business Name
            </label>
            <input
              type="text"
              value={headerData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Email
            </label>
            <input
              type="email"
              value={headerData.company_email}
              onChange={(e) => handleInputChange('company_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Phone
            </label>
            <input
              type="tel"
              value={headerData.company_phone}
              onChange={(e) => handleInputChange('company_phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Website
            </label>
            <input
              type="url"
              value={headerData.company_website}
              onChange={(e) => handleInputChange('company_website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter website URL"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Address
            </label>
            <textarea
              value={headerData.company_address}
              onChange={(e) => handleInputChange('company_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter business address"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Header Text
            </label>
            <textarea
              value={headerData.header_custom_text}
              onChange={(e) => handleInputChange('header_custom_text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Enter custom text to display in invoice header"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={headerData.show_logo}
                  onChange={(e) => handleInputChange('show_logo', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Logo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={headerData.show_contact}
                  onChange={(e) => handleInputChange('show_contact', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Contact Info</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={headerData.show_address}
                  onChange={(e) => handleInputChange('show_address', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Address</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start space-x-4">
            {headerData.show_logo && headerData.company_logo && (
              <div className="flex-shrink-0">
                <img
                  src={headerData.company_logo}
                  alt="Company Logo"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {headerData.company_name || 'Your Company Name'}
              </h2>
              
              {headerData.header_custom_text && (
                <p className="text-gray-600 mb-3 italic">
                  {headerData.header_custom_text}
                </p>
              )}

              <div className="space-y-1">
                {headerData.show_address && headerData.company_address && (
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    <span>{headerData.company_address}</span>
                  </div>
                )}
                
                {headerData.show_contact && (
                  <>
                    {headerData.company_phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        <span>{headerData.company_phone}</span>
                      </div>
                    )}
                    
                    {headerData.company_email && (
                      <div className="flex items-center text-gray-600">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        <span>{headerData.company_email}</span>
                      </div>
                    )}
                    
                    {headerData.company_website && (
                      <div className="flex items-center text-gray-600">
                        <Globe size={16} className="mr-2 text-gray-400" />
                        <span>{headerData.company_website}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditable && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 flex items-center space-x-1"
          >
            <Edit size={16} />
            <span>Edit Header</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceHeader;
