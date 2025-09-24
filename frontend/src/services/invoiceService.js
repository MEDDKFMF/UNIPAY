// Invoice service for API calls
import api from './api';

// Get all invoices with optional filters
export const getInvoices = async (params = new URLSearchParams()) => {
  try {
    const response = await api.get(`/api/invoices/?${params}`);
    // Return full response object for pagination support
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Get a single invoice by ID
export const getInvoice = async (id) => {
  try {
    const response = await api.get(`/api/invoices/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

// Get all clients
export const getClients = async () => {
  try {
    const response = await api.get('/api/clients/');
    // Return full response object for pagination support
    return response.data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

// Create a new invoice
export const createInvoice = async (invoiceData) => {
  try {
    console.log('Sending invoice data to API:', invoiceData);
    console.log('API URL:', `/api/invoices/`);
    
    const response = await api.post('/api/invoices/', invoiceData);
    
    console.log('API Response status:', response.status);
    console.log('API Response headers:', response.headers);
    
    return response.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// Update an existing invoice
export const updateInvoice = async (id, invoiceData) => {
  try {
    const response = await api.put(`/api/invoices/${id}/`, invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Delete an invoice
export const deleteInvoice = async (id) => {
  try {
    await api.delete(`/api/invoices/${id}/`);
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Update invoice status
export const updateInvoiceStatus = async (id, status) => {
  try {
    const response = await api.patch(`/api/invoices/${id}/status/`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

// Get invoice PDF
export const getInvoicePDF = async (id) => {
  try {
    const response = await api.get(`/api/invoices/${id}/pdf/`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice PDF:', error);
    throw error;
  }
};

// Download invoice PDF
export const downloadInvoicePDF = async (id) => {
  try {
    const response = await api.get(`/api/invoices/${id}/pdf/`, {
      responseType: 'blob'
    });

    const blob = response.data;
    const contentType = response.headers['content-type'];
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename based on content type
    if (contentType && contentType.includes('application/pdf')) {
      link.download = `invoice_${id}.pdf`;
    } else {
      link.download = `invoice_${id}.html`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
};

// Export invoices to CSV
export const exportInvoicesCSV = async (params = new URLSearchParams()) => {
  try {
    const response = await api.get(`/api/invoices/export-csv/?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting invoices:', error);
    throw error;
  }
};

// Get invoice statistics
export const getInvoiceStats = async () => {
  try {
    const response = await api.get('/api/invoices/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    throw error;
  }
}; 