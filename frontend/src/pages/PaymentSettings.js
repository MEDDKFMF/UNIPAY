import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Settings, CheckCircle, XCircle, AlertCircle, Save, Plus, Trash2, Building2, Smartphone, Landmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUserPaymentMethods, createUserPaymentMethod, updateUserPaymentMethod, deleteUserPaymentMethod, getAvailablePaymentMethods } from '../services/paymentService';

const PaymentSettings = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  
  const [formData, setFormData] = useState({
    payment_type: 'unipay',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_swift_code: '',
    bank_branch_code: '',
    mpesa_phone_number: '',
    mpesa_account_name: '',
    flutterwave_email: '',
    flutterwave_phone: '',
    card_last_four: '',
    card_brand: '',
    card_expiry: '',
    is_primary: false,
    is_active: true
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const [methodsData, availableData] = await Promise.all([
        getUserPaymentMethods(),
        getAvailablePaymentMethods()
      ]);
      
      // Ensure we always set an array
      setPaymentMethods(Array.isArray(methodsData) ? methodsData : []);
      setAvailableMethods(Array.isArray(availableData?.available_methods) ? availableData.available_methods : []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
      // Set empty arrays on error
      setPaymentMethods([]);
      setAvailableMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddMethod = () => {
    setEditingMethod(null);
    setFormData({
      payment_type: 'bank_account',
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      bank_swift_code: '',
      bank_branch_code: '',
      mpesa_phone_number: '',
      mpesa_account_name: '',
      card_last_four: '',
      card_brand: '',
      card_expiry: '',
      is_primary: false,
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleEditMethod = (method) => {
    setEditingMethod(method);
    setFormData({
      payment_type: method.payment_type,
      bank_name: method.bank_name || '',
      bank_account_number: method.bank_account_number || '',
      bank_account_name: method.bank_account_name || '',
      bank_swift_code: method.bank_swift_code || '',
      bank_branch_code: method.bank_branch_code || '',
      mpesa_phone_number: method.mpesa_phone_number || '',
      mpesa_account_name: method.mpesa_account_name || '',
      card_last_four: method.card_last_four || '',
      card_brand: method.card_brand || '',
      card_expiry: method.card_expiry || '',
      is_primary: method.is_primary,
      is_active: method.is_active
    });
    setShowAddModal(true);
  };

  const handleSaveMethod = async () => {
    try {
      setSaving(true);
      if (editingMethod) {
        await updateUserPaymentMethod(editingMethod.id, formData);
        toast.success('Payment method updated successfully!');
      } else {
        await createUserPaymentMethod(formData);
        toast.success('Payment method added successfully!');
      }
      setShowAddModal(false);
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deleteUserPaymentMethod(methodId);
        toast.success('Payment method deleted successfully!');
        await fetchPaymentMethods();
      } catch (error) {
        console.error('Error deleting payment method:', error);
        toast.error('Failed to delete payment method');
      }
    }
  };

  const getMethodIcon = (methodType) => {
    switch (methodType) {
      case 'bank_account':
        return Landmark;
      case 'mpesa':
        return Smartphone;
      case 'card':
        return CreditCard;
      default:
        return Settings;
    }
  };

  const getMethodDisplayName = (methodType) => {
    switch (methodType) {
      case 'bank_account':
        return 'Bank Account';
      case 'unipay':
        return 'Unipay (M-Pesa)';
      case 'flutterwave':
        return 'Flutterwave';
      default:
        return methodType;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Payment Receiving Methods</h1>
          <p className="text-gray-600 mt-1">
            Configure how you want to receive payments from your customers
          </p>
        </div>
        <button
          onClick={handleAddMethod}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Payment Receiving Methods</h3>
        {!Array.isArray(paymentMethods) || paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods Configured</h3>
            <p className="text-gray-600 mb-6">Add your payment receiving details to start accepting payments</p>
            <button
              onClick={handleAddMethod}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(paymentMethods) && paymentMethods.map((method) => {
              const IconComponent = getMethodIcon(method.payment_type);
              return (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{method.display_name}</h4>
                      <p className="text-sm text-gray-500">
                        {method.payment_type === 'bank_account' && `${method.bank_name} ****${method.bank_account_number?.slice(-4)}`}
                        {method.payment_type === 'mpesa' && method.mpesa_phone_number}
                        {method.payment_type === 'card' && `${method.card_brand} ****${method.card_last_four}`}
                      </p>
                    </div>
                    {method.is_primary && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditMethod(method)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveMethod(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="unipay">Unipay (M-Pesa)</option>
                  <option value="flutterwave">Flutterwave</option>
                  <option value="bank_account">Bank Account</option>
                </select>
              </div>

              {/* Bank Account Fields */}
              {formData.payment_type === 'bank_account' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Equity Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      name="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      name="bank_account_name"
                      value={formData.bank_account_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SWIFT/BIC Code
                      </label>
                      <input
                        type="text"
                        name="bank_swift_code"
                        value={formData.bank_swift_code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., EQBLKENA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Code
                      </label>
                      <input
                        type="text"
                        name="bank_branch_code"
                        value={formData.bank_branch_code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 001"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Unipay M-Pesa Fields */}
              {formData.payment_type === 'unipay' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      M-Pesa Phone Number *
                    </label>
                    <input
                      type="text"
                      name="mpesa_phone_number"
                      value={formData.mpesa_phone_number}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="254XXXXXXXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 254XXXXXXXXX</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="mpesa_account_name"
                      value={formData.mpesa_account_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your M-Pesa account name"
                    />
                  </div>
                </>
              )}

              {/* Flutterwave Fields */}
              {formData.payment_type === 'flutterwave' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flutterwave Account Email *
                    </label>
                    <input
                      type="email"
                      name="flutterwave_email"
                      value={formData.flutterwave_email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your-email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="flutterwave_phone"
                      value={formData.flutterwave_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+254700000000"
                    />
                  </div>
                </>
              )}

              {/* Card Fields */}
              {formData.payment_type === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Last 4 Digits *
                    </label>
                    <input
                      type="text"
                      name="card_last_four"
                      value={formData.card_last_four}
                      onChange={handleInputChange}
                      required
                      maxLength="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Brand *
                    </label>
                    <select
                      name="card_brand"
                      value={formData.card_brand}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Brand</option>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Expiry *
                    </label>
                    <input
                      type="text"
                      name="card_expiry"
                      value={formData.card_expiry}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MM/YYYY"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_primary"
                  checked={formData.is_primary}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Set as primary payment method
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingMethod ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">How Payment Receiving Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-medium text-blue-900 mb-2">Add Your Details</h4>
            <p className="text-sm text-blue-800">Add your bank account, M-Pesa number, or Flutterwave details where you want to receive payments</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h4 className="font-medium text-blue-900 mb-2">We Handle the Rest</h4>
            <p className="text-sm text-blue-800">Our platform manages all payment gateway integrations and technical setup</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h4 className="font-medium text-blue-900 mb-2">Receive Payments</h4>
            <p className="text-sm text-blue-800">Your customers can pay using Unipay (M-Pesa) or Flutterwave, and funds go directly to your account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;