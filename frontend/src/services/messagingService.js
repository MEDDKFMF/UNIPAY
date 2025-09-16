import api from './api';

// Send invoice notification
export const sendInvoiceNotification = async (data) => {
  try {
    const response = await api.post('/api/messaging/send-invoice/', data);
    return response.data;
  } catch (error) {
    console.error('Error sending invoice notification:', error);
    throw error;
  }
};

// Send payment confirmation
export const sendPaymentConfirmation = async (data) => {
  try {
    const response = await api.post('/api/messaging/send-payment-confirmation/', data);
    return response.data;
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    throw error;
  }
};

// Send payment reminder
export const sendPaymentReminder = async (data) => {
  try {
    const response = await api.post('/api/messaging/send-reminder/', data);
    return response.data;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    throw error;
  }
};

// Get notification templates
export const getTemplates = async () => {
  try {
    const response = await api.get('/api/messaging/templates/');
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Get specific template
export const getTemplate = async (id) => {
  try {
    const response = await api.get(`/api/messaging/templates/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

// Create template
export const createTemplate = async (templateData) => {
  try {
    const response = await api.post('/api/messaging/templates/', templateData);
    return response.data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Update template
export const updateTemplate = async (id, templateData) => {
  try {
    const response = await api.put(`/api/messaging/templates/${id}/`, templateData);
    return response.data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

// Delete template
export const deleteTemplate = async (id) => {
  try {
    const response = await api.delete(`/api/messaging/templates/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};
