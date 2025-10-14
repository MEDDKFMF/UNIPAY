import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getPaymentStatus, deletePayment } from '../services/paymentService';
import logger from '../utils/logger';

const POLL_INTERVAL = 3000;

const PaymentMpesaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const data = await getPaymentStatus(id);
      setPayment(data);
      setLoading(false);

      // Stop polling if final state
      if (['completed', 'failed', 'cancelled'].includes(data.status)) {
        stopPolling();
      }
    } catch (err) {
      logger.error('Failed to fetch payment status:', err);
      setLoading(false);
      // keep polling in case backend is temporarily unavailable
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    fetchStatus();
    startPolling();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await deletePayment(id);
      toast.success('Payment deleted');
      navigate('/app/payments');
    } catch (err) {
      logger.error('Failed to delete payment:', err);
      toast.error('Failed to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">M-Pesa Payment</h1>

        {loading && <p>Loading payment status...</p>}

        {!loading && !payment && (
          <div>
            <p className="text-sm text-gray-600">Payment not found.</p>
          </div>
        )}

        {payment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Invoice</p>
                <p className="font-medium">{payment.invoice_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="font-medium">{payment.client_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-medium">{payment.currency} {parseFloat(payment.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className={`font-medium ${payment.status === 'completed' ? 'text-green-600' : payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {payment.status}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Gateway: {payment.payment_method}</p>
              <p className="text-sm text-gray-600">Transaction ID: {payment.transaction_id || '—'}</p>
              <p className="text-sm text-gray-600">Gateway session: {payment.gateway_session_id || '—'}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded">Back</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete payment'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMpesaPage;
