import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import logger from '../utils/logger';

const PublicPayPage = () => {
  const { token } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/payments/link/${token}/`);
        setLink(res.data);
      } catch (err) {
        logger.error('Failed to fetch public link:', err);
        toast.error('Payment link not found or expired');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  const handleStripe = async () => {
    try {
      const res = await api.post(`/api/payments/link/${token}/initiate/`, {});
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (err) {
      logger.error('Stripe init failed:', err);
      toast.error(err.response?.data?.error || 'Failed to initiate stripe payment');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!link) return <div className="p-6">Payment link not found or expired.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold">Pay Invoice {link.invoice_number}</h2>
        <p className="text-sm text-gray-600">Amount: {link.currency} {link.amount}</p>
        <div className="mt-4 space-y-4">
          {link.payment_method === 'stripe' && (
            <div>
              <button onClick={handleStripe} className="px-4 py-2 bg-indigo-600 text-white rounded">Pay with Card (Stripe)</button>
            </div>
          )}

          {link.payment_method === 'manual' && (
            <div>
              <p className="text-sm text-gray-600">This payment link is for manual/offline payments. Please follow the instructions provided by the seller.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicPayPage;
