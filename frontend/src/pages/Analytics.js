import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PieChart,
  Target,
  Percent
} from 'lucide-react';
import { getInvoices, getClients } from '../services/invoiceService';
import { getExchangeRates } from '../services/exchangeRateService';
import { CURRENCIES, getPopularCurrencies } from '../config/currencies';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalClients: 0,
    averageInvoiceValue: 0,
    monthlyRevenue: [],
    invoiceStatusDistribution: [],
    topClients: [],
    recentActivity: [],
    paymentAnalytics: {
      averagePaymentTime: 0,
      onTimePayments: 0,
      latePayments: 0,
      collectionRate: 0
    },
    clientMetrics: {
      newClients: 0,
      repeatClients: 0,
      averageClientValue: 0,
      clientRetentionRate: 0
    },
    invoiceMetrics: {
      averageInvoiceSize: 0,
      largestInvoice: 0,
      smallestInvoice: 0,
      invoiceGrowthRate: 0
    }
  });
  const [timeRange, setTimeRange] = useState('30'); // days
  const [currency, setCurrency] = useState('KES');
  const [exchangeRates, setExchangeRates] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  useEffect(() => {
    console.log('Analytics - useEffect: fetchExchangeRates');
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    console.log('Analytics - useEffect: fetchAnalytics triggered', { exchangeRates: !!exchangeRates, timeRange, currency });
    if (exchangeRates) {
      fetchAnalytics();
    } else {
      // Fallback: fetch analytics without exchange rates after a delay
      const timer = setTimeout(() => {
        console.log('Analytics - Fallback: fetching without exchange rates');
        fetchAnalytics();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [timeRange, currency, exchangeRates]);

  const fetchExchangeRates = async () => {
    try {
      setCurrencyLoading(true);
      console.log('Analytics - Fetching exchange rates...');
      const rates = await getExchangeRates();
      console.log('Analytics - Exchange rates received:', rates);
      setExchangeRates(rates);
    } catch (error) {
      console.error('Analytics - Error fetching exchange rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setCurrencyLoading(false);
    }
  };

  const convertToCurrency = (amount, fromCurrency, toCurrency) => {
    if (!exchangeRates) {
      console.log(`Analytics - No exchange rates available, returning original amount: ${amount} ${fromCurrency}`);
      return amount;
    }
    
    if (fromCurrency === toCurrency) {
      console.log(`Analytics - Same currency, no conversion needed: ${amount} ${fromCurrency}`);
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
      
      console.log(`Analytics - Converting ${amount} ${fromCurrency} to ${toCurrency}: fromRate=${fromRate}, toRate=${toRate}`);
      
      // Convert to USD first, then to target currency
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      
      console.log(`Analytics - Conversion result: ${amount} ${fromCurrency} -> ${usdAmount} USD -> ${convertedAmount} ${toCurrency}`);
      return convertedAmount;
    } catch (error) {
      console.error('Analytics - Currency conversion error:', error);
      return amount; // Return original amount if conversion fails
    }
  };

  const formatCurrency = (amount, currencyCode) => {
    const currencySymbols = {
      'KES': 'KSh',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'GHS': '₵',
      'ZAR': 'R',
      'UGX': 'USh',
      'TZS': 'TSh',
      'CNY': '¥',
      'JPY': '¥',
      'INR': '₹',
      'AUD': 'A$',
      'CAD': 'C$'
    };
    
    const symbol = currencySymbols[currencyCode] || currencyCode;
    return `${symbol} ${parseFloat(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Analytics - Starting fetchAnalytics...');
      
      // Fetch invoices and clients data
      const [invoicesResponse, clientsResponse] = await Promise.all([
        getInvoices(),
        getClients()
      ]);

      console.log('Analytics - Raw responses:', { invoicesResponse, clientsResponse });

      const invoices = invoicesResponse.results || invoicesResponse || [];
      const clients = clientsResponse.results || clientsResponse || [];
      
      console.log('Analytics - Processed data:', { invoices, clients });

      // Calculate analytics
      const now = new Date();
      const daysAgo = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));

      // Filter invoices by time range
      const filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= daysAgo;
      });

      // Calculate metrics with currency conversion
      const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid' || inv.status === 'PAID');
      console.log('Analytics - Paid invoices:', paidInvoices);
      console.log('Analytics - Exchange rates:', exchangeRates);
      console.log('Analytics - Selected currency:', currency);
      
      const totalRevenue = paidInvoices.reduce((sum, inv) => {
        const amount = parseFloat(inv.total_amount) || 0;
        const convertedAmount = convertToCurrency(amount, inv.currency, currency);
        console.log(`Analytics - Invoice ${inv.invoice_number}: ${amount} ${inv.currency} -> ${convertedAmount} ${currency}`);
        return sum + convertedAmount;
      }, 0);
      
      console.log('Analytics - Total revenue calculated:', totalRevenue);

      const totalInvoices = filteredInvoices.length;
      const paidInvoicesCount = paidInvoices.length;
      const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'PENDING' || inv.status === 'sent').length;
      const overdueInvoices = filteredInvoices.filter(inv => inv.status === 'overdue' || inv.status === 'OVERDUE').length;
      const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // Monthly revenue data (last 6 months)
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.issue_date);
          return invDate >= month && invDate <= monthEnd && (inv.status === 'paid' || inv.status === 'PAID');
        });
        
        const monthRevenue = monthInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.total_amount) || 0;
          const convertedAmount = convertToCurrency(amount, inv.currency, currency);
          return sum + convertedAmount;
        }, 0);
        
        monthlyRevenue.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue
        });
      }

      // Invoice status distribution
      const invoiceStatusDistribution = [
        { status: 'Paid', count: paidInvoicesCount, color: 'bg-green-500' },
        { status: 'Pending', count: pendingInvoices, color: 'bg-yellow-500' },
        { status: 'Overdue', count: overdueInvoices, color: 'bg-red-500' },
        { status: 'Draft', count: filteredInvoices.filter(inv => inv.status === 'draft').length, color: 'bg-gray-500' }
      ];

      // Top clients by revenue
      const clientRevenue = {};
      invoices.filter(inv => inv.status === 'paid' || inv.status === 'PAID').forEach(invoice => {
        const clientName = invoice.client_name || 'Unknown Client';
        const amount = parseFloat(invoice.total_amount) || 0;
        const convertedAmount = convertToCurrency(amount, invoice.currency, currency);
        clientRevenue[clientName] = (clientRevenue[clientName] || 0) + convertedAmount;
      });

      const topClients = Object.entries(clientRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Recent activity (last 10 invoices)
      const recentActivity = invoices
        .sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))
        .slice(0, 10)
        .map(invoice => ({
          id: invoice.id,
          type: 'invoice',
          title: `Invoice #${invoice.invoice_number}`,
          description: `${invoice.client_name} - ${formatCurrency(invoice.total_amount, invoice.currency)}`,
          date: invoice.issue_date,
          status: invoice.status
        }));

      // Payment Analytics
      const paidInvoicesWithDates = invoices.filter(inv => inv.status === 'PAID' && inv.paid_date);
      const paymentTimes = paidInvoicesWithDates.map(inv => {
        const issueDate = new Date(inv.issue_date);
        const paidDate = new Date(inv.paid_date);
        return Math.ceil((paidDate - issueDate) / (1000 * 60 * 60 * 24));
      });
      
      const averagePaymentTime = paymentTimes.length > 0 
        ? paymentTimes.reduce((sum, time) => sum + time, 0) / paymentTimes.length 
        : 0;

      const onTimePayments = invoices.filter(inv => {
        if (inv.status !== 'PAID' || !inv.paid_date) return false;
        const issueDate = new Date(inv.issue_date);
        const dueDate = new Date(inv.due_date);
        const paidDate = new Date(inv.paid_date);
        return paidDate <= dueDate;
      }).length;

      const latePayments = invoices.filter(inv => {
        if (inv.status !== 'PAID' || !inv.paid_date) return false;
        const dueDate = new Date(inv.due_date);
        const paidDate = new Date(inv.paid_date);
        return paidDate > dueDate;
      }).length;

      const collectionRate = totalInvoices > 0 ? (paidInvoicesCount / totalInvoices) * 100 : 0;

      // Client Metrics
      const clientInvoiceCounts = {};
      invoices.forEach(inv => {
        const clientName = inv.client_name || 'Unknown Client';
        clientInvoiceCounts[clientName] = (clientInvoiceCounts[clientName] || 0) + 1;
      });

      const newClients = Object.keys(clientInvoiceCounts).filter(client => clientInvoiceCounts[client] === 1).length;
      const repeatClients = Object.keys(clientInvoiceCounts).filter(client => clientInvoiceCounts[client] > 1).length;
      const averageClientValue = clients.length > 0 ? totalRevenue / clients.length : 0;
      const clientRetentionRate = clients.length > 0 ? (repeatClients / clients.length) * 100 : 0;

      // Invoice Metrics - Convert all amounts to selected currency
      const invoiceAmounts = invoices.map(inv => {
        const amount = parseFloat(inv.total_amount) || 0;
        return convertToCurrency(amount, inv.currency, currency);
      });
      const averageInvoiceSize = invoiceAmounts.length > 0 
        ? invoiceAmounts.reduce((sum, amount) => sum + amount, 0) / invoiceAmounts.length 
        : 0;
      const largestInvoice = invoiceAmounts.length > 0 ? Math.max(...invoiceAmounts) : 0;
      const smallestInvoice = invoiceAmounts.length > 0 ? Math.min(...invoiceAmounts.filter(amount => amount > 0)) : 0;

      // Calculate growth rate (comparing current period to previous period)
      const previousPeriodStart = new Date(now.getTime() - (parseInt(timeRange) * 2 * 24 * 60 * 60 * 1000));
      const previousPeriodEnd = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));
      
      const previousPeriodInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.issue_date);
        return invDate >= previousPeriodStart && invDate < previousPeriodEnd;
      }).length;

      const invoiceGrowthRate = previousPeriodInvoices > 0 
        ? ((totalInvoices - previousPeriodInvoices) / previousPeriodInvoices) * 100 
        : 0;

      setAnalytics({
        totalRevenue,
        totalInvoices,
        paidInvoices: paidInvoicesCount,
        pendingInvoices,
        overdueInvoices,
        totalClients: clients.length,
        averageInvoiceValue,
        monthlyRevenue,
        invoiceStatusDistribution,
        topClients,
        recentActivity,
        paymentAnalytics: {
          averagePaymentTime: Math.round(averagePaymentTime),
          onTimePayments,
          latePayments,
          collectionRate: Math.round(collectionRate * 100) / 100
        },
        clientMetrics: {
          newClients,
          repeatClients,
          averageClientValue: Math.round(averageClientValue * 100) / 100,
          clientRetentionRate: Math.round(clientRetentionRate * 100) / 100
        },
        invoiceMetrics: {
          averageInvoiceSize: Math.round(averageInvoiceSize * 100) / 100,
          largestInvoice,
          smallestInvoice,
          invoiceGrowthRate: Math.round(invoiceGrowthRate * 100) / 100
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'OVERDUE':
        return 'text-red-600 bg-red-50';
      case 'draft':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Pending';
      case 'OVERDUE':
        return 'Overdue';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(analytics.totalRevenue, currency)],
      ['Total Invoices', analytics.totalInvoices],
      ['Paid Invoices', analytics.paidInvoices],
      ['Pending Invoices', analytics.pendingInvoices],
      ['Overdue Invoices', analytics.overdueInvoices],
      ['Total Clients', analytics.totalClients],
      ['Average Payment Time (days)', analytics.paymentAnalytics.averagePaymentTime],
      ['Collection Rate (%)', analytics.paymentAnalytics.collectionRate],
      ['Client Retention Rate (%)', analytics.clientMetrics.clientRetentionRate],
      ['Invoice Growth Rate (%)', analytics.invoiceMetrics.invoiceGrowthRate]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics data exported successfully');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Insights into your business performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            
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
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export analytics data"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
             <button
               onClick={fetchAnalytics}
               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
               title="Refresh analytics"
             >
               <RefreshCw className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue, currency)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalInvoices}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.paidInvoices}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-4">
            {analytics.monthlyRevenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month.month}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (month.revenue / Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {formatCurrency(month.revenue, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="space-y-4">
            {analytics.invoiceStatusDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm text-gray-600">{item.status}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
             </div>

       {/* Payment Analytics */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white rounded-xl border border-gray-200 p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Avg Payment Time</p>
               <p className="text-2xl font-bold text-gray-900">
                 {analytics.paymentAnalytics.averagePaymentTime} days
               </p>
             </div>
             <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
               <Clock className="w-6 h-6 text-blue-600" />
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl border border-gray-200 p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Collection Rate</p>
               <p className="text-2xl font-bold text-gray-900">
                 {analytics.paymentAnalytics.collectionRate}%
               </p>
             </div>
             <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
               <Target className="w-6 h-6 text-green-600" />
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl border border-gray-200 p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">On-Time Payments</p>
               <p className="text-2xl font-bold text-gray-900">
                 {analytics.paymentAnalytics.onTimePayments}
               </p>
             </div>
             <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
               <CheckCircle className="w-6 h-6 text-green-600" />
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl border border-gray-200 p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Late Payments</p>
               <p className="text-2xl font-bold text-gray-900">
                 {analytics.paymentAnalytics.latePayments}
               </p>
             </div>
             <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
               <AlertTriangle className="w-6 h-6 text-red-600" />
             </div>
           </div>
         </div>
       </div>

       {/* Client & Invoice Metrics */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Client Performance */}
         <div className="bg-white rounded-xl border border-gray-200 p-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
             <Users className="w-5 h-5 mr-2" />
             Client Performance
           </h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-600">New Clients</span>
               <span className="text-sm font-medium text-gray-900">{analytics.clientMetrics.newClients}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-600">Repeat Clients</span>
               <span className="text-sm font-medium text-gray-900">{analytics.clientMetrics.repeatClients}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-600">Avg Client Value</span>
               <span className="text-sm font-medium text-gray-900">
                 {formatCurrency(analytics.clientMetrics.averageClientValue, currency)}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-600">Retention Rate</span>
               <span className="text-sm font-medium text-gray-900">
                 {analytics.clientMetrics.clientRetentionRate}%
               </span>
             </div>
           </div>
         </div>

        {/* Invoice Insights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Invoice Insights
          </h3>
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Avg Invoice Size</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(analytics.invoiceMetrics.averageInvoiceSize, currency)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Largest Invoice</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(analytics.invoiceMetrics.largestInvoice, currency)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Smallest Invoice</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(analytics.invoiceMetrics.smallestInvoice, currency)}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Total Invoices</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {analytics.totalInvoices}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Paid Invoices</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {analytics.paidInvoices} ({analytics.totalInvoices > 0 ? Math.round((analytics.paidInvoices / analytics.totalInvoices) * 100) : 0}%)
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Growth Rate</span>
              </div>
              <span className={`text-sm font-semibold ${
                analytics.invoiceMetrics.invoiceGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.invoiceMetrics.invoiceGrowthRate >= 0 ? '+' : ''}{analytics.invoiceMetrics.invoiceGrowthRate}%
              </span>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Invoice Performance</span>
              <span className="text-xs text-gray-500">Last {timeRange} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${analytics.totalInvoices > 0 ? Math.min((analytics.paidInvoices / analytics.totalInvoices) * 100, 100) : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {analytics.totalInvoices > 0 ? Math.round((analytics.paidInvoices / analytics.totalInvoices) * 100) : 0}% of invoices are paid
            </p>
          </div>
        </div>
       </div>

       {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
          <div className="space-y-4">
            {analytics.topClients.length > 0 ? (
              analytics.topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">{client.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(client.revenue, currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No revenue data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
