import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Eye,
  Download,
  Plus,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getInvoices, getClients } from '../services/invoiceService';
import { getExchangeRates } from '../services/exchangeRateService';
import { CURRENCIES, getPopularCurrencies } from '../config/currencies';
import { STATUS_COLORS, STATUS_LABELS } from '../utils/invoiceStatus';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalClients: 0,
    revenueChange: 0,
    invoiceChange: 0,
    clientChange: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [currency, setCurrency] = useState('KES');

  const fetchExchangeRates = async () => {
    try {
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all invoices and clients
      const [invoicesData, clientsData] = await Promise.all([
        getInvoices(),
        getClients()
      ]);
      
      // Debug: Log exchange rates and invoices
      console.log('Exchange rates:', exchangeRates);
      console.log('Exchange rates keys:', exchangeRates ? Object.keys(exchangeRates) : 'No rates');
      console.log('USD rate:', exchangeRates?.USD);
      console.log('KSH rate:', exchangeRates?.KSH);
      console.log('Invoices:', invoicesData.results || []);

      const invoices = invoicesData.results || [];
      const clients = Array.isArray(clientsData.results) ? clientsData.results : (Array.isArray(clientsData) ? clientsData : []);

      // Calculate stats from real data
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      console.log('Paid invoices:', paidInvoices);
      
      // Only calculate revenue if exchange rates are available
      let totalRevenue = 0;
      if (exchangeRates) {
        totalRevenue = paidInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.total_amount) || 0;
          const convertedAmount = convertToCurrency(amount, inv.currency, currency);
          console.log(`Invoice ${inv.invoice_number}: ${amount} ${inv.currency} -> ${convertedAmount} ${currency}`);
          return sum + convertedAmount;
        }, 0);
      } else {
        console.log('Exchange rates not available, using raw amounts');
        totalRevenue = paidInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.total_amount) || 0;
          console.log(`Invoice ${inv.invoice_number}: ${amount} ${inv.currency} (no conversion)`);
          return sum + amount;
        }, 0);
      }
      
      console.log('Total revenue calculated:', totalRevenue);
      
      const paidInvoicesCount = paidInvoices.length;
      const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
      const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
      
      const totalClients = clients.length;

      setStats({
        totalInvoices,
        totalRevenue,
        pendingInvoices: pendingInvoices + draftInvoices, // Include drafts as pending
        paidInvoices: paidInvoicesCount,
        overdueInvoices,
        totalClients,
        revenueChange: 0, // TODO: Calculate from previous month
        invoiceChange: 0, // TODO: Calculate from previous month
        clientChange: 0   // TODO: Calculate from previous month
      });

      // Get recent invoices (last 5)
      const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.created_at || b.issue_date) - new Date(a.created_at || a.issue_date))
        .slice(0, 5);
      
      setRecentInvoices(recentInvoices);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [exchangeRates, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (exchangeRates) {
      fetchDashboardData();
    }
  }, [exchangeRates, fetchDashboardData]);

  // Refresh data when user returns to the dashboard
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.draft;
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || STATUS_LABELS.draft;
  };

  const convertToCurrency = (amount, fromCurrency, toCurrency) => {
    if (!exchangeRates) {
      console.log(`No exchange rates available: ${amount} ${fromCurrency}`);
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
      
      // Check if we have the currency in exchange rates
      const fromRate = exchangeRates[fromCurrency];
      const toRate = exchangeRates[toCurrency];
      
      console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency}: fromRate=${fromRate}, toRate=${toRate}`);
      
      if (!fromRate || !toRate) {
        console.log(`Missing exchange rates for conversion: ${fromCurrency} -> ${toCurrency}`);
        return amount;
      }
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
            <p className="text-gray-600">
              Here's an overview of your business today
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[200px]"
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
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh exchange rates"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Rates
            </button>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh dashboard"
            >
              <ArrowUpRight className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue, currency)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500">Common tasks to get you started</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/app/invoices/create"
            className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Create Invoice</h3>
              <p className="text-sm text-gray-600">Generate a new invoice</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          to="/app/clients/create"
            className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Add Client</h3>
              <p className="text-sm text-gray-600">Add a new client</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </Link>

          <Link
            to="/app/analytics"
            className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">View Analytics</h3>
              <p className="text-sm text-gray-600">Business insights</p>
          </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </Link>

        <Link
            to="/app/payments"
            className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Manage Payments</h3>
              <p className="text-sm text-gray-600">Payment tracking</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
        </Link>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Invoices</h2>
            <Link
              to="/app/invoices"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              View all
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
              <Link
                to="/app/invoices/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/app/invoices/${invoice.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/app/invoices/${invoice.id}`); }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Invoice #{invoice.invoice_number}
                      </h3>
                      <p className="text-sm text-gray-600">{invoice.client_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => navigate(`/app/invoices/${invoice.id}`)}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 