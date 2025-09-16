import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPayments } from '../services/paymentService';
import { getExchangeRates } from '../services/exchangeRateService';
import { CURRENCIES, getPopularCurrencies } from '../config/currencies';
import CreatePaymentModal from '../components/CreatePaymentModal';



const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [stats, setStats] = useState({
    totalAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalCount: 0
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [currency, setCurrency] = useState('KES');
  const [exchangeRates, setExchangeRates] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // Currency conversion function
  const convertToCurrency = (amount, fromCurrency, toCurrency) => {
    if (!exchangeRates) {
      console.log(`No exchange rates available, returning original amount: ${amount} ${fromCurrency}`);
      return amount;
    }
    
    if (fromCurrency === toCurrency) {
      console.log(`Same currency, no conversion needed: ${amount} ${fromCurrency}`);
      return amount;
    }
    
    try {
      // Handle both KES and KSH as the same currency
      if (fromCurrency === 'KES' || fromCurrency === 'KSH') {
        fromCurrency = 'KSH';
      }
      if (toCurrency === 'KES' || toCurrency === 'KSH') {
        toCurrency = 'KSH';
      }
      
      // Use the exchange rates directly
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      
      console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency}: fromRate=${fromRate}, toRate=${toRate}`);
      
      // Convert to USD first, then to target currency
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      
      console.log(`Conversion result: ${amount} ${fromCurrency} -> ${usdAmount} USD -> ${convertedAmount} ${toCurrency}`);
      return convertedAmount;
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount; // Return original amount if conversion fails
    }
  };

  // Format currency function
  const formatCurrency = (amount, currency = 'KES') => {
    // Handle NaN, null, or undefined values
    if (!amount || isNaN(amount)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(0);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    try {
      setCurrencyLoading(true);
      console.log('Payments - Fetching exchange rates...');
      const rates = await getExchangeRates();
      console.log('Payments - Exchange rates received:', rates);
      setExchangeRates(rates);
    } catch (error) {
      console.error('Payments - Error fetching exchange rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setCurrencyLoading(false);
    }
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const paymentsData = await getPayments();
      
      // Handle both paginated and non-paginated responses
      const paymentsList = paymentsData.results || paymentsData;
      setPayments(paymentsList);
      
      // Calculate stats with currency conversion
      let totalAmount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let failedCount = 0;
      
      paymentsList.forEach(payment => {
        const amount = parseFloat(payment.amount) || 0;
        const convertedAmount = convertToCurrency(amount, payment.currency, currency);
        totalAmount += convertedAmount;
        
        switch (payment.status) {
          case 'completed':
            completedCount++;
            break;
          case 'pending':
          case 'processing':
            pendingCount++;
            break;
          case 'failed':
          case 'cancelled':
            failedCount++;
            break;
          default:
            break;
        }
      });
      
      setStats({
        totalAmount,
        completedCount,
        pendingCount,
        failedCount,
        totalCount: paymentsList.length
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
      setPayments([]);
      setStats({
        totalAmount: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        totalCount: 0
      });
    } finally {
      setLoading(false);
    }
  }, [currency, exchangeRates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch exchange rates on component mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Fetch payments when exchange rates are available
  useEffect(() => {
    if (exchangeRates) {
      fetchPayments();
    }
  }, [exchangeRates]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleRecordPayment = () => {
    // For now, we'll create a dummy invoice for testing
    // In a real scenario, you might want to show a list of unpaid invoices first
    const dummyInvoice = {
      id: 'new-payment',
      invoice_number: 'NEW-PAYMENT',
      total_amount: 0,
      currency: 'KES',
      status: 'draft'
    };
    setSelectedInvoice(dummyInvoice);
    setShowPaymentModal(true);
  };

  const handlePaymentCreated = (newPayment) => {
    // Refresh the payments list
    fetchPayments();
    toast.success('Payment recorded successfully!');
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'stripe':
        return '💳';
      case 'flutterwave':
        return '🌍';
      case 'mpesa':
        return '📱';
      case 'manual':
        return '✋';
      default:
        return '💰';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = (payment.invoice_number && payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (payment.client_name && payment.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (payment.reference && payment.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'amount':
        aValue = parseFloat(a.amount) || 0;
        bValue = parseFloat(b.amount) || 0;
        break;
      case 'date':
        aValue = new Date(a.payment_date || a.created_at);
        bValue = new Date(b.payment_date || b.created_at);
        break;
      case 'client':
        aValue = a.client_name || '';
        bValue = b.client_name || '';
        break;
      default:
        aValue = new Date(a.payment_date || a.created_at);
        bValue = new Date(b.payment_date || b.created_at);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Use stats from API instead of calculating from payments array
  const { totalAmount, completedCount, pendingCount, failedCount } = stats;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">Manage and track all payment transactions</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={currencyLoading}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 min-w-[200px]"
            >
              <optgroup label="Popular Currencies">
                {getPopularCurrencies().map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Currencies">
                {CURRENCIES.filter(c => !getPopularCurrencies().find(p => p.code === c.code)).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              onClick={fetchExchangeRates}
              disabled={currencyLoading}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh exchange rates"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${currencyLoading ? 'animate-spin' : ''}`} />
              {currencyLoading ? 'Updating...' : 'Refresh Rates'}
            </button>
            <button
              onClick={fetchPayments}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button 
              onClick={handleRecordPayment}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount, currency)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="client">Sort by Client</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>


      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invoice</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reference</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No payments found</p>
                    <p className="text-sm">Start by recording your first payment</p>
                  </td>
                </tr>
              ) : (
                sortedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{payment.invoice_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{payment.client_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.currency || 'KES'} {parseFloat(payment.amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getPaymentMethodIcon(payment.payment_method)}</span>
                        <span className="text-sm text-gray-900 capitalize">{payment.payment_method || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status || 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">{payment.reference || payment.transaction_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <CreatePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={selectedInvoice}
        onPaymentCreated={handlePaymentCreated}
      />
    </div>
  );
};

export default Payments;
