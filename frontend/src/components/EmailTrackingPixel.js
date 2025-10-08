import React, { useEffect } from 'react';
import api from '../services/api';

const EmailTrackingPixel = ({ invoiceId }) => {
  useEffect(() => {
    // Track email opened when component mounts
    const trackEmailOpened = async () => {
      try {
        await api.post(`/api/invoices/${invoiceId}/track/opened/`);
      } catch (error) {
        console.error('Error tracking email opened:', error);
      }
    };

    trackEmailOpened();
  }, [invoiceId]);

  // Return a 1x1 transparent pixel
  return (
    <img
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      width="1"
      height="1"
      style={{ display: 'none' }}
      alt=""
    />
  );
};

export default EmailTrackingPixel;
