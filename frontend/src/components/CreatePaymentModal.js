import React, { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, DollarSign, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPayment, createCheckoutSession, getAvailablePaymentMethods } from '../services/paymentService';
import { getInvoices } from '../services/invoiceService';

const CreatePaymentModal = ({ isOpen, onClose, invoice, onPaymentCreated }) => {
  const [formData, setFormData] = useState({
    invoice_id: invoice?.id || '',
    amount: invoice?.total_amount || 0,
    currency: invoice?.currency || 'KES',
    payment_method: 'manual',
    status: 'completed',
    transaction_id: '',
    error_message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availableMethods, setAvailableMethods] = useState(['manual']);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const fetchAvailableMethods = useCallback(async () => {
    try {
      const response = await getAvailablePaymentMethods();
      setAvailableMethods(response.available_methods || ['manual']);
      
      // Set default payment method if current one is not available
      if (!response.available_methods.includes(formData.payment_method)) {
        setFormData(prev => ({
          ...prev,
          payment_method: response.default_method || 'manual'
        }));
      }
    } catch (error) {
      console.error('Error fetching available payment methods:', error);
      // Keep manual as fallback
      setAvailableMethods(['manual']);
    }
  }, [formData.payment_method]);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const response = await getInvoices();
      const invoicesList = response.results || response;
      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMethods();
      if (!invoice) {
        fetchInvoices();
      }
    }
  }, [isOpen, invoice, fetchAvailableMethods, fetchInvoices]);

  // Update form data when invoice is selected from dropdown
  useEffect(() => {
    if (formData.invoice_id && invoices.length > 0) {
      const selectedInvoice = invoices.find(inv => inv.id === parseInt(formData.invoice_id));
      if (selectedInvoice) {
        setFormData(prev => ({
          ...prev,
          amount: selectedInvoice.total_amount,
          currency: selectedInvoice.currency
        }));
      }
    }
  }, [formData.invoice_id, invoices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedInvoice = invoice || invoices.find(inv => inv.id === parseInt(formData.invoice_id));
    
    if (!selectedInvoice) {
      toast.error('No invoice selected');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    // Handle different payment methods
    if (formData.payment_method === 'manual') {
      await handleManualPayment(selectedInvoice);
    } else {
      await handleGatewayPayment(selectedInvoice);
    }
  };

  const handleManualPayment = async (selectedInvoice) => {
    setIsLoading(true);
    try {
      const paymentData = {
        invoice: selectedInvoice.id,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        payment_method: formData.payment_method,
        status: formData.status,
        transaction_id: formData.transaction_id || null,
        error_message: formData.error_message || null
      };

      const response = await createPayment(paymentData);
      
      toast.success('Payment recorded successfully!');
      onPaymentCreated(response);
      onClose();
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatewayPayment = async (selectedInvoice) => {
    setIsProcessingPayment(true);
    try {
      const successUrl = `${window.location.origin}/app/invoices/${selectedInvoice.id}?payment=success`;
      const cancelUrl = `${window.location.origin}/app/invoices/${selectedInvoice.id}?payment=cancelled`;
      
      const response = await createCheckoutSession(
        selectedInvoice.id,
        successUrl,
        cancelUrl,
        formData.payment_method
      );
      
      // Redirect to payment gateway
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        toast.error('Failed to create payment session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: invoice?.total_amount || 0,
      currency: invoice?.currency || 'KES',
      payment_method: 'manual',
      status: 'completed',
      transaction_id: '',
      error_message: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-600">
                Invoice #{invoice?.invoice_number} - {invoice?.client?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Invoice total: {invoice?.currency} {parseFloat(invoice?.total_amount || 0).toLocaleString()}
            </p>
          </div>

          {/* Invoice Selection - Only when no specific invoice is provided */}
          {!invoice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Invoice *
              </label>
              {loadingInvoices ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading invoices...</span>
                </div>
              ) : (
                <select
                  name="invoice_id"
                  value={formData.invoice_id}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose an invoice</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.client_name} - {inv.currency} {parseFloat(inv.total_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="UGX">UGX - Ugandan Shilling</option>
              <option value="TZS">TZS - Tanzanian Shilling</option>
              <option value="RWF">RWF - Rwandan Franc</option>
              <option value="ETB">ETB - Ethiopian Birr</option>
              <option value="NGN">NGN - Nigerian Naira</option>
              <option value="GHS">GHS - Ghanaian Cedi</option>
              <option value="ZAR">ZAR - South African Rand</option>
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="MAD">MAD - Moroccan Dirham</option>
              <option value="TND">TND - Tunisian Dinar</option>
              <option value="DZD">DZD - Algerian Dinar</option>
              <option value="LYD">LYD - Libyan Dinar</option>
              <option value="SDG">SDG - Sudanese Pound</option>
              <option value="SOS">SOS - Somali Shilling</option>
              <option value="DJF">DJF - Djiboutian Franc</option>
              <option value="KMF">KMF - Comorian Franc</option>
              <option value="MUR">MUR - Mauritian Rupee</option>
              <option value="SCR">SCR - Seychellois Rupee</option>
              <option value="MGA">MGA - Malagasy Ariary</option>
              <option value="BWP">BWP - Botswanan Pula</option>
              <option value="SZL">SZL - Swazi Lilangeni</option>
              <option value="LSL">LSL - Lesotho Loti</option>
              <option value="NAD">NAD - Namibian Dollar</option>
              <option value="ZMW">ZMW - Zambian Kwacha</option>
              <option value="ZWL">ZWL - Zimbabwean Dollar</option>
              <option value="MWK">MWK - Malawian Kwacha</option>
              <option value="AOA">AOA - Angolan Kwanza</option>
              <option value="MZN">MZN - Mozambican Metical</option>
              <option value="MAD">MAD - Moroccan Dirham</option>
              <option value="XOF">XOF - West African CFA Franc</option>
              <option value="XAF">XAF - Central African CFA Franc</option>
              <option value="CDF">CDF - Congolese Franc</option>
              <option value="BIF">BIF - Burundian Franc</option>
              <option value="RWF">RWF - Rwandan Franc</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="NZD">NZD - New Zealand Dollar</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="NOK">NOK - Norwegian Krone</option>
              <option value="SEK">SEK - Swedish Krona</option>
              <option value="DKK">DKK - Danish Krone</option>
              <option value="PLN">PLN - Polish Zloty</option>
              <option value="CZK">CZK - Czech Koruna</option>
              <option value="HUF">HUF - Hungarian Forint</option>
              <option value="RON">RON - Romanian Leu</option>
              <option value="BGN">BGN - Bulgarian Lev</option>
              <option value="HRK">HRK - Croatian Kuna</option>
              <option value="RSD">RSD - Serbian Dinar</option>
              <option value="MKD">MKD - Macedonian Denar</option>
              <option value="ALL">ALL - Albanian Lek</option>
              <option value="ISK">ISK - Icelandic Krona</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="KRW">KRW - South Korean Won</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="HKD">HKD - Hong Kong Dollar</option>
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="MYR">MYR - Malaysian Ringgit</option>
              <option value="THB">THB - Thai Baht</option>
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="PHP">PHP - Philippine Peso</option>
              <option value="VND">VND - Vietnamese Dong</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="BDT">BDT - Bangladeshi Taka</option>
              <option value="LKR">LKR - Sri Lankan Rupee</option>
              <option value="NPR">NPR - Nepalese Rupee</option>
              <option value="BTN">BTN - Bhutanese Ngultrum</option>
              <option value="MVR">MVR - Maldivian Rufiyaa</option>
              <option value="AFN">AFN - Afghan Afghani</option>
              <option value="IRR">IRR - Iranian Rial</option>
              <option value="IQD">IQD - Iraqi Dinar</option>
              <option value="JOD">JOD - Jordanian Dinar</option>
              <option value="LBP">LBP - Lebanese Pound</option>
              <option value="SYP">SYP - Syrian Pound</option>
              <option value="ILS">ILS - Israeli New Shekel</option>
              <option value="PAL">PAL - Palestinian Pound</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="QAR">QAR - Qatari Riyal</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="OMR">OMR - Omani Rial</option>
              <option value="KWD">KWD - Kuwaiti Dinar</option>
              <option value="BHD">BHD - Bahraini Dinar</option>
              <option value="YER">YER - Yemeni Rial</option>
              <option value="TRY">TRY - Turkish Lira</option>
              <option value="AZN">AZN - Azerbaijani Manat</option>
              <option value="AMD">AMD - Armenian Dram</option>
              <option value="GEL">GEL - Georgian Lari</option>
              <option value="KZT">KZT - Kazakhstani Tenge</option>
              <option value="KGS">KGS - Kyrgyzstani Som</option>
              <option value="TJS">TJS - Tajikistani Somoni</option>
              <option value="TMT">TMT - Turkmenistani Manat</option>
              <option value="UZS">UZS - Uzbekistani Som</option>
              <option value="MNT">MNT - Mongolian Tugrik</option>
              <option value="RUB">RUB - Russian Ruble</option>
              <option value="BYN">BYN - Belarusian Ruble</option>
              <option value="UAH">UAH - Ukrainian Hryvnia</option>
              <option value="MDL">MDL - Moldovan Leu</option>
              <option value="BRL">BRL - Brazilian Real</option>
              <option value="ARS">ARS - Argentine Peso</option>
              <option value="CLP">CLP - Chilean Peso</option>
              <option value="COP">COP - Colombian Peso</option>
              <option value="PEN">PEN - Peruvian Sol</option>
              <option value="BOB">BOB - Bolivian Boliviano</option>
              <option value="VES">VES - Venezuelan Bolívar</option>
              <option value="UYU">UYU - Uruguayan Peso</option>
              <option value="PYG">PYG - Paraguayan Guarani</option>
              <option value="MXN">MXN - Mexican Peso</option>
              <option value="GTQ">GTQ - Guatemalan Quetzal</option>
              <option value="HNL">HNL - Honduran Lempira</option>
              <option value="NIO">NIO - Nicaraguan Córdoba</option>
              <option value="CRC">CRC - Costa Rican Colón</option>
              <option value="PAB">PAB - Panamanian Balboa</option>
              <option value="DOP">DOP - Dominican Peso</option>
              <option value="HTG">HTG - Haitian Gourde</option>
              <option value="JMD">JMD - Jamaican Dollar</option>
              <option value="TTD">TTD - Trinidad and Tobago Dollar</option>
              <option value="BBD">BBD - Barbadian Dollar</option>
              <option value="XCD">XCD - East Caribbean Dollar</option>
              <option value="AWG">AWG - Aruban Florin</option>
              <option value="ANG">ANG - Netherlands Antillean Guilder</option>
              <option value="SRD">SRD - Surinamese Dollar</option>
              <option value="GYD">GYD - Guyanese Dollar</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableMethods.map(method => (
                <option key={method} value={method}>
                  {method === 'manual' && 'Manual Entry (Record existing payment)'}
                  {method === 'unipay' && 'Unipay M-Pesa (Process payment now)'}
                  {method === 'flutterwave' && 'Flutterwave (Process payment now)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.payment_method === 'manual' 
                ? 'Record a payment that has already been made'
                : 'Process payment through the selected gateway'
              }
            </p>
            {availableMethods.length === 1 && availableMethods[0] === 'manual' && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>No payment gateways configured.</strong> Only manual payment recording is available. 
                  Configure your payment gateways in Settings to enable online payments.
                </p>
              </div>
            )}
          </div>

          {/* Status - Only for manual payments */}
          {formData.payment_method === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}

          {/* Transaction ID - Only for manual payments */}
          {formData.payment_method === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., TXN-123456"
              />
            </div>
          )}

          {/* Error Message (for failed manual payments) */}
          {formData.payment_method === 'manual' && formData.status === 'failed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Message
              </label>
              <textarea
                name="error_message"
                value={formData.error_message}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the payment failure..."
              />
            </div>
          )}

          {/* Warning for partial payments - Only for manual payments */}
          {formData.payment_method === 'manual' && parseFloat(formData.amount) < parseFloat(invoice?.total_amount || 0) && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Partial Payment</p>
                <p className="text-sm text-yellow-700">
                  This payment is less than the invoice total. The invoice will remain unpaid.
                </p>
              </div>
            </div>
          )}

          {/* Gateway payment info */}
          {formData.payment_method !== 'manual' && (
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Payment Gateway</p>
                <p className="text-sm text-blue-700">
                  You will be redirected to {formData.payment_method} to complete the payment. 
                  The payment will be automatically recorded upon success.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isProcessingPayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Recording...</span>
                </>
              ) : isProcessingPayment ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {formData.payment_method === 'manual' ? 'Record Payment' : 'Process Payment'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePaymentModal;
