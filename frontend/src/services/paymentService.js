import api from './api';

export const getPayments = async (params = {}) => {
  try {
    const response = await api.get('/api/payments/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const getPaymentById = async (paymentId) => {
  try {
    const response = await api.get(`/api/payments/${paymentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

export const getPaymentsForInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`/api/payments/invoice/${invoiceId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments for invoice:', error);
    throw error;
  }
};

export const createPayment = async (paymentData) => {
  try {
    const response = await api.post(`/api/payments/`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePayment = async (paymentId, paymentData) => {
  try {
    const response = await api.patch(`/api/payments/${paymentId}/`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

export const deletePayment = async (paymentId) => {
  try {
    const response = await api.delete(`/api/payments/${paymentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

export const getPaymentStats = async () => {
  try {
    const response = await api.get(`/api/payments/`);
    const payments = response.data.results || response.data;
    
    const stats = {
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      totalCount: payments.length
    };
    
    payments.forEach(payment => {
      stats.totalAmount += parseFloat(payment.amount) || 0;
      
      switch (payment.status) {
        case 'completed':
          stats.completedCount++;
          break;
        case 'pending':
        case 'processing':
          stats.pendingCount++;
          break;
        case 'failed':
        case 'cancelled':
          stats.failedCount++;
          break;
        default:
          break;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    throw error;
  }
};

export const createCheckoutSession = async (invoiceId, successUrl, cancelUrl, paymentMethod = 'stripe') => {
  try {
    const response = await api.post(`/api/payments/create-checkout/`, {
      invoice_id: invoiceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method: paymentMethod
    });
    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await api.get(`/api/payments/status/${paymentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};

// User Payment Methods (for receiving payments)
export const getUserPaymentMethods = async () => {
  try {
    const response = await api.get(`/api/payments/user-methods/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user payment methods:', error);
    throw error;
  }
};

export const createUserPaymentMethod = async (methodData) => {
  try {
    const response = await api.post(`/api/payments/user-methods/`, methodData);
    return response.data;
  } catch (error) {
    console.error('Error creating user payment method:', error);
    throw error;
  }
};

export const updateUserPaymentMethod = async (methodId, methodData) => {
  try {
    const response = await api.patch(`/api/payments/user-methods/${methodId}/`, methodData);
    return response.data;
  } catch (error) {
    console.error('Error updating user payment method:', error);
    throw error;
  }
};

export const deleteUserPaymentMethod = async (methodId) => {
  try {
    const response = await api.delete(`/api/payments/user-methods/${methodId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user payment method:', error);
    throw error;
  }
};

// Client Payment Methods (for recurring payments)
export const getClientPaymentMethods = async () => {
  try {
    const response = await api.get(`/api/payments/client-methods/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching client payment methods:', error);
    throw error;
  }
};

export const createClientPaymentMethod = async (methodData) => {
  try {
    const response = await api.post(`/api/payments/client-methods/`, methodData);
    return response.data;
  } catch (error) {
    console.error('Error creating client payment method:', error);
    throw error;
  }
};

export const updateClientPaymentMethod = async (methodId, methodData) => {
  try {
    const response = await api.patch(`/api/payments/client-methods/${methodId}/`, methodData);
    return response.data;
  } catch (error) {
    console.error('Error updating client payment method:', error);
    throw error;
  }
};

export const deleteClientPaymentMethod = async (methodId) => {
  try {
    const response = await api.delete(`/api/payments/client-methods/${methodId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting client payment method:', error);
    throw error;
  }
};

export const getAvailablePaymentMethods = async () => {
  try {
    const response = await api.get(`/api/payments/available-methods/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available payment methods:', error);
    throw error;
  }
};

export const testPaymentGateway = async (gateway) => {
  try {
    const response = await api.post(`/api/payments/test-gateway/`, {
      gateway: gateway
    });
    return response.data;
  } catch (error) {
    console.error(`Error testing ${gateway} gateway:`, error);
    throw error;
  }
};
