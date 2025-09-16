import React, { useState } from 'react';
import { X, Copy, Share2, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { createPaymentLink, copyPaymentLink, sharePaymentLink, generateQRCode } from '../services/paymentLinkService';
import toast from 'react-hot-toast';

const PaymentLinkModal = ({ isOpen, onClose, invoice, onPaymentLinkCreated }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('flutterwave');
  const [paymentLink, setPaymentLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const handleCreatePaymentLink = async () => {
    if (!invoice) return;
    
    try {
      setLoading(true);
      const response = await createPaymentLink(invoice.id, paymentMethod);
      
      setPaymentLink(response);
      setQrCodeUrl(generateQRCode(response.payment_link));
      
      if (onPaymentLinkCreated) {
        onPaymentLinkCreated(response);
      }
      
      toast.success('Payment link created successfully!');
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast.error(error.response?.data?.error || 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLink?.payment_link) return;
    
    try {
      await copyPaymentLink(paymentLink.payment_link);
      setCopied(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy payment link');
    }
  };

  const handleShareLink = async () => {
    if (!paymentLink?.payment_link) return;
    
    try {
      const success = await sharePaymentLink(paymentLink.payment_link, paymentLink.invoice_number);
      if (success) {
        toast.success('Payment link shared successfully!');
      } else {
        toast.error('Failed to share payment link');
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      toast.error('Failed to share payment link');
    }
  };

  const handleOpenPaymentLink = () => {
    if (paymentLink?.payment_link) {
      window.open(paymentLink.payment_link, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Payment Link
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!paymentLink ? (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Invoice #:</span> {invoice?.invoice_number}</p>
                  <p><span className="font-medium">Client:</span> {invoice?.client_name || 'N/A'}</p>
                  <p><span className="font-medium">Amount:</span> {invoice?.currency} {parseFloat(invoice?.total_amount || 0).toLocaleString()}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      invoice?.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice?.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice?.status?.charAt(0).toUpperCase() + invoice?.status?.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('flutterwave')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      paymentMethod === 'flutterwave'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Flutterwave</div>
                    <div className="text-sm text-gray-600">Cards, Bank Transfer, Mobile Money</div>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('unipay')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      paymentMethod === 'unipay'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">M-Pesa (Unipay)</div>
                    <div className="text-sm text-gray-600">Mobile Money Payments</div>
                  </button>
                </div>
              </div>

              {/* Warning for paid invoices */}
              {invoice?.status === 'paid' && (
                <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div className="text-sm text-yellow-800">
                    This invoice is already marked as paid. Creating a payment link may not be necessary.
                  </div>
                </div>
              )}

              {/* Create Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePaymentLink}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Payment Link'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-sm text-green-800">
                  Payment link created successfully! Share this link with your client to collect payment.
                </div>
              </div>

              {/* Payment Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentLink.payment_link}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code
                  </label>
                  <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Scan with mobile device to open payment link
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                
                <button
                  onClick={handleShareLink}
                  className="flex items-center px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                
                <button
                  onClick={handleOpenPaymentLink}
                  className="flex items-center px-4 py-2 text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Payment Page
                </button>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">{paymentLink.currency} {parseFloat(paymentLink.amount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <span className="ml-2 font-medium">{paymentLink.payment_method.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Client:</span>
                    <span className="ml-2 font-medium">{paymentLink.client_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Invoice:</span>
                    <span className="ml-2 font-medium">#{paymentLink.invoice_number}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkModal;
