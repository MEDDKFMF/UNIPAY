import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Send, Edit, Trash2, Calendar, User, Building, Mail, Phone, MapPin, FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Link } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';
import { getInvoice, deleteInvoice, updateInvoiceStatus } from '../services/invoiceService';
import { sendInvoiceNotification } from '../services/messagingService';
import InvoiceHeader from '../components/InvoiceHeader';
import Button from '../components/ui/Button';
import CreatePaymentModal from '../components/CreatePaymentModal';
import PaymentLinkModal from '../components/PaymentLinkModal';

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInvoice(id);
      setInvoice(data);
    } catch (error) {
      toast.error('Failed to fetch invoice');
      logger.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
    
    // Handle payment callbacks
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully!');
      // Remove the payment parameter from URL
      navigate(`/app/invoices/${id}`, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled');
      // Remove the payment parameter from URL
      navigate(`/app/invoices/${id}`, { replace: true });
    }
  }, [fetchInvoice, searchParams, navigate, id]);

  const handlePrintPDF = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`https://unipay-oyn6.onrender.com/api/invoices/${id}/pdf/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      
      const blob = await response.blob();
      const contentType = response.headers.get('content-type');
      const url = window.URL.createObjectURL(blob);
      
      // Create a new window for printing
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          window.URL.revokeObjectURL(url);
        };
      } else {
        // Fallback: download the file
        const link = document.createElement('a');
        link.href = url;
        if (contentType && contentType.includes('application/pdf')) {
          link.download = `invoice_${id}.pdf`;
        } else {
          link.download = `invoice_${id}.html`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toast.success('File opened for printing');
    } catch (error) {
      toast.error('Failed to print file');
      logger.error('Error printing file:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendToClient = async () => {
    if (!invoice) return;
    
    // Check if client has email
    if (!invoice.client?.email) {
      toast.error('Client email is required to send invoice');
      return;
    }
    
    // Confirm before sending
    const confirmed = window.confirm(
      `Send invoice #${invoice.invoice_number} to ${invoice.client.name} (${invoice.client.email})?`
    );
    
    if (!confirmed) return;
    
    try {
      setDownloading(true);
      
      // Update invoice status to 'sent' if it's currently 'draft'
      if (invoice.status === 'draft') {
        await updateInvoiceStatus(id, 'sent');
        setInvoice(prev => ({ ...prev, status: 'sent' }));
      }
      
      // Send email notification
      await sendInvoiceNotification({
        invoice_id: id,
        notification_type: 'invoice_sent'
      });
      
      toast.success('Invoice sent to client successfully');
    } catch (error) {
      toast.error('Failed to send invoice');
      logger.error('Error sending invoice:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        toast.success('Invoice deleted successfully');
        navigate('/app/invoices');
      } catch (error) {
        toast.error('Failed to delete invoice');
        logger.error('Error deleting invoice:', error);
      }
    }
  };

  const handlePaymentCreated = (payment) => {
    // Refresh the invoice data to show updated status
    fetchInvoice();
    toast.success('Payment recorded successfully!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount, currencySymbol = '') => {
    if (amount === null || amount === undefined) return '0.00';
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/app/invoices')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/app/invoices')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Invoice Details</h1>
                <p className="text-sm text-gray-500">#{invoice.invoice_number}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {invoice.status !== 'paid' && (
                <>
                  <Button onClick={() => setShowPaymentModal(true)} variant="success" icon={CreditCard}>
                    Record Payment
                  </Button>
                  
                  <Button onClick={() => setShowPaymentLinkModal(true)} variant="blue" icon={Link}>
                    Create Payment Link
                  </Button>
                </>
              )}
              
              <Button onClick={() => navigate(`/app/invoices/${id}/edit`)} icon={Edit}>
                Edit
              </Button>
              
              <Button onClick={handlePrintPDF} disabled={downloading} loading={downloading} variant="success" icon={Printer}>
                Print Invoice
              </Button>
              
              <Button onClick={handleSendToClient} disabled={downloading} loading={downloading} variant="purple" icon={Send}>
                Send to Client
              </Button>
              
              <Button onClick={handleDelete} variant="danger" icon={Trash2}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Custom Invoice Header */}
            <InvoiceHeader isEditable={false} />
            
            {/* Invoice Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">UniPay Invoice</h2>
                  <p className="text-gray-500">#{invoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-2">{invoice.get_status_display || invoice.status}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Issue Date</h3>
                  <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                  <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.description}</div>
                              {item.notes && (
                                <div className="text-sm text-gray-500 mt-1">{item.notes}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {invoice.currency_symbol} {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {invoice.currency_symbol} {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{invoice.currency_symbol} {formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
                    <span className="font-medium">{invoice.currency_symbol} {formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.discount_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount ({invoice.discount_rate}%):</span>
                    <span className="font-medium text-red-600">-{invoice.currency_symbol} {formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-semibold text-gray-900">{invoice.currency_symbol} {formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms_conditions) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {invoice.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms_conditions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms_conditions}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(invoice.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="text-sm font-medium text-gray-900">{invoice.created_by_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="text-sm font-medium text-gray-900">{invoice.currency || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Client Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{invoice.client_name || 'N/A'}</p>
                  </div>
                </div>
                {invoice.client_company_name && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-sm font-medium text-gray-900">{invoice.client_company_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{invoice.client_email || 'N/A'}</p>
                  </div>
                </div>
                {invoice.client_phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{invoice.client_phone}</p>
                    </div>
                  </div>
                )}
                {invoice.client_address && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{invoice.client_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Payment Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal:</span>
                  <span className="text-sm font-medium">{invoice.currency_symbol} {formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tax:</span>
                    <span className="text-sm font-medium">{invoice.currency_symbol} {formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.discount_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Discount:</span>
                    <span className="text-sm font-medium text-red-600">-{invoice.currency_symbol} {formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold text-gray-900">Total:</span>
                  <span className="text-sm font-semibold text-gray-900">{invoice.currency_symbol} {formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <CreatePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoice}
        onPaymentCreated={handlePaymentCreated}
      />

      {/* Payment Link Modal */}
      <PaymentLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        invoice={invoice}
        onPaymentLinkCreated={(paymentLink) => {
          logger.debug('Payment link created:', paymentLink);
          // Optionally update invoice status or show success message
        }}
      />
    </div>
  );
};

export default ViewInvoice; 