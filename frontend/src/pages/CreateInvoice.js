import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowLeftIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { createInvoice } from '../services/invoiceService';
import { getClients } from '../services/clientService';
import { useNotifications } from '../context/NotificationContext';
import { CURRENCIES, getPopularCurrencies } from '../config/currencies';

const schema = yup.object({
  client: yup.string().required('Please select a client'),
  currency: yup.string().required('Please select a currency'),
  exchange_rate: yup.number().positive('Exchange rate must be positive').required('Exchange rate is required'),
  due_date: yup.date().required('Due date is required'),

  notes: yup.string(),
  items: yup.array().of(
    yup.object({
      description: yup.string().required('Item description is required'),
      quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
      unit_price: yup.number().positive('Unit price must be positive').required('Unit price is required'),
    })
  ).min(1, 'At least one item is required')
});

// Use the comprehensive currency list from config
const currencies = CURRENCIES;

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setClientsLoading] = useState(true);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [exchangeRate, setExchangeRate] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      items: [{ description: '', quantity: 1, unit_price: 0 }],
      currency: 'KES',
      exchange_rate: 1,
      due_date: new Date().toISOString().split('T')[0],
      status: 'draft'
    }
  });

  const watchedItems = watch('items');

  const fetchClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      const response = await getClients();
      setClients(response.data || response || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const fetchExchangeRate = useCallback(async (currency) => {
    if (currency === 'KES') {
      setExchangeRate(1);
      setValue('exchange_rate', 1);
      return;
    }

    try {
    setExchangeRateLoading(true);
      // Get exchange rate from the selected currency to KES
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      const data = await response.json();
      const rate = data.rates.KES; // Direct rate from selected currency to KES
      const roundedRate = parseFloat(rate.toFixed(6));
      setExchangeRate(roundedRate);
      setValue('exchange_rate', roundedRate);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setExchangeRate(1);
      setValue('exchange_rate', 1);
    } finally {
      setExchangeRateLoading(false);
    }
  }, [setValue]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);



  const addItem = () => {
    const currentItems = watchedItems || [];
    setValue('items', [...currentItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    const currentItems = watchedItems || [];
    if (currentItems.length > 1) {
      setValue('items', currentItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // Total should be in the selected currency, not converted to KES
    return subtotal;
  };

  const onSubmit = async (data) => {
    try {
    setLoading(true);
      
      console.log('Form data before processing:', data);
      
      // Process form data
      const processedData = {
        client: parseInt(data.client), // Ensure client is an integer
        currency: data.currency,
        exchange_rate: parseFloat(data.exchange_rate),
        due_date: new Date(data.due_date).toISOString().split('T')[0],
        issue_date: new Date().toISOString().split('T')[0], // Add issue_date
        status: data.status, // Use status from form
        notes: data.notes || '',
        terms_conditions: '',
        items: data.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      console.log('Processed data being sent:', processedData);

      const response = await createInvoice(processedData);
      
      // Add notification for successful invoice creation
      const selectedClient = clients.find(client => client.id === parseInt(data.client));
      addNotification({
        id: Date.now(), // Temporary ID for frontend
        type: 'invoice_created',
        message: `New invoice created for ${selectedClient?.name || 'client'}`,
        data: {
          invoice_number: response.invoice_number || 'N/A',
          client_name: selectedClient?.name || 'Unknown Client'
        },
        is_read: false,
        created_at: new Date().toISOString()
      });
      
      navigate('/app/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(`Error creating invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
        <button
              onClick={() => navigate('/app/invoices')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Invoices
        </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-gray-600 mt-1">Generate a new invoice for your client</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <DocumentTextIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
              </div>
              <p className="text-gray-600 mt-1">Enter the essential details for your invoice</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Client *
              </label>
              <select
                {...register('client')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.client ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
              >
                    <option value="">Choose a client...</option>
                {(clients || []).map((client) => (
                  <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                  </option>
                ))}
              </select>
              {errors.client && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.client.message}
                    </p>
              )}
            </div>

            <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Currency *
              </label>
              <select
                {...register('currency')}
                value={selectedCurrency}
                onChange={(e) => {
                  const newCurrency = e.target.value;
                  setSelectedCurrency(newCurrency);
                  fetchExchangeRate(newCurrency);
                }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
              >
                <optgroup label="Popular Currencies">
                  {getPopularCurrencies().map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Currencies">
                  {CURRENCIES.filter(c => !getPopularCurrencies().find(p => p.code === c.code)).map(currency => (
                  <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
                </optgroup>
              </select>
              {errors.currency && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.currency.message}
                    </p>
              )}
            </div>

            <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Exchange Rate ({selectedCurrency} to KES)
                <button
                  type="button"
                  onClick={() => fetchExchangeRate(selectedCurrency)}
                  disabled={exchangeRateLoading}
                      className="ml-2 inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                      <ArrowPathIcon className={`w-3 h-3 mr-1 ${exchangeRateLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </label>
                <input
                  type="number"
                    step="0.000001"
                  {...register('exchange_rate')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.exchange_rate ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="1.000000"
                    onInput={(e) => {
                      // Round to 6 decimal places to avoid browser validation issues
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        e.target.value = value.toFixed(6);
                      }
                    }}
                  />
              {errors.exchange_rate && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.exchange_rate.message}
                    </p>
              )}
            </div>

            <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Due Date *
              </label>
              <input
                type="date"
                {...register('due_date')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
              />
              {errors.due_date && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.due_date.message}
                    </p>
              )}
            </div>

            <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Status
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 font-medium">Draft</span>
                      <span className="text-gray-500 text-sm ml-2">(New invoices start as draft)</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Status will automatically update when you send the invoice to the client
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Notes
              </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                  placeholder="Additional notes or terms..."
                />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Invoice Items
                  </h2>
                </div>
            <button
              type="button"
              onClick={addItem}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
                  <PlusIcon className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
              <p className="text-gray-600 mt-1">Add the items or services for this invoice</p>
            </div>
            <div className="p-6">
          <div className="space-y-4">
            {watchedItems?.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="lg:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                  </label>
                  <input
                    {...register(`items.${index}.description`)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.items?.[index]?.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Item or service description"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.items[index].description.message}
                        </p>
                      )}
                </div>
                    <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.quantity`)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.items?.[index]?.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    placeholder="1"
                  />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.items[index].quantity.message}
                        </p>
                      )}
                </div>
                    <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unit_price`)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.items?.[index]?.unit_price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    placeholder="0.00"
                  />
                      {errors.items?.[index]?.unit_price && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.items[index].unit_price.message}
                        </p>
                      )}
                </div>
                    <div className="lg:col-span-2 flex items-end">
                      <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total
                  </label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700">
                          {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                        </div>
                      </div>
                </div>
                  {watchedItems.length > 1 && (
                      <div className="lg:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                          <TrashIcon className="w-4 h-4 mx-auto" />
                    </button>
                      </div>
                  )}
              </div>
            ))}
          </div>
        </div>
            </div>

          {/* Invoice Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Invoice Summary
                </h2>
              </div>
              <p className="text-gray-600 mt-1">Review the totals before creating your invoice</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal ({selectedCurrency}):</span>
                    <span className="font-semibold text-gray-900">
                      {calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  {selectedCurrency !== 'KES' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Exchange Rate:</span>
                      <span className="font-semibold text-gray-900">
                        1 {selectedCurrency} = {exchangeRate.toFixed(6)} KES
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total ({selectedCurrency}):</span>
                      <span className="text-xl font-bold text-gray-900">
                        {calculateTotal().toFixed(2)}
                      </span>
                    </div>
            </div>
          </div>
          </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
              onClick={() => navigate('/app/invoices')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Create Invoice
                </>
              )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice; 