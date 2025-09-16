import api from './api';

/**
 * Payment Link Service
 * Handles creation and management of payment links for invoices
 */

export const createPaymentLink = async (invoiceId, paymentMethod = 'flutterwave') => {
  try {
    const response = await api.post('/api/payments/create-payment-link/', {
      invoice_id: invoiceId,
      payment_method: paymentMethod
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await api.get(`/api/payments/status/${paymentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

export const copyPaymentLink = (link) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(link);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        textArea.remove();
        resolve();
      } else {
        textArea.remove();
        reject(new Error('Unable to copy to clipboard'));
      }
    });
  }
};

export const sharePaymentLink = async (link, invoiceNumber) => {
  const shareData = {
    title: `Payment for Invoice ${invoiceNumber}`,
    text: `Please pay your invoice ${invoiceNumber} using this secure payment link: ${link}`,
    url: link
  };

  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Error sharing payment link:', error);
      return false;
    }
  } else {
    // Fallback to copying to clipboard
    try {
      await copyPaymentLink(link);
      return true;
    } catch (error) {
      console.error('Error copying payment link:', error);
      return false;
    }
  }
};

export const generateQRCode = (link) => {
  // This would integrate with a QR code library like qrcode.js
  // For now, we'll return a placeholder
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
};

export const validatePaymentLink = (link) => {
  try {
    const url = new URL(link);
    // Check if it's a valid payment link
    return url.protocol === 'https:' && (
      url.hostname.includes('flutterwave') || 
      url.hostname.includes('checkout') ||
      url.pathname.includes('/app/payments/')
    );
  } catch (error) {
    return false;
  }
};
