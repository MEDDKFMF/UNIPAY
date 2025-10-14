import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import logger from '../utils/logger';

const PublicPayPage = () => {
  const { token } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');

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

  const handleMpesaPay = async () => {
    if (!phone) return toast.error('Enter phone number');
    try {
      const res = await api.post(`/api/payments/link/${token}/initiate/`, { phone_number: phone });
      toast.success(res.data.message || 'STK Push initiated. Check your phone.');
    } catch (err) {
      logger.error('Failed to initiate M-Pesa:', err);
      toast.error(err.response?.data?.error || 'Failed to initiate payment');
    }
  };

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
          {link.payment_method === 'unipay' && (
            <div>
              <label className="block text-sm">Phone (254...)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full p-2 border rounded" placeholder="2547XXXXXXXX" />
              <button onClick={handleMpesaPay} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Pay with M-Pesa</button>
            </div>
          )}

          {link.payment_method === 'stripe' && (
            <div>
              <button onClick={handleStripe} className="px-4 py-2 bg-indigo-600 text-white rounded">Pay with Card (Stripe)</button>
            </div>
          )}

          {link.payment_method === 'flutterwave' && (
            <div>
              <p className="text-sm text-gray-600">You will be redirected to Flutterwave to complete payment.</p>
              <button onClick={handleStripe} className="px-4 py-2 bg-green-600 text-white rounded">Pay with Flutterwave</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicPayPage;
