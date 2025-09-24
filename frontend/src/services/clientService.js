// Client service for API calls
import api from './api';

// Get all clients with optional filters
export const getClients = async (params = new URLSearchParams()) => {
  try {
    const response = await api.get(`/api/clients/?${params}`);
    // Handle paginated response
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

// Get a single client by ID
export const getClient = async (id) => {
  try {
    const response = await api.get(`/api/clients/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

// Create a new client
export const createClient = async (clientData) => {
  try {
    const response = await api.post('/api/clients/', clientData);
    return response.data;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

// Update an existing client
export const updateClient = async (id, clientData) => {
  try {
    const response = await api.put(`/api/clients/${id}/`, clientData);
    return response.data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Delete a client
export const deleteClient = async (id) => {
  try {
    await api.delete(`/api/clients/${id}/`);
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Search clients
export const searchClients = async (searchQuery) => {
  try {
    const params = new URLSearchParams({ search: searchQuery });
    const response = await api.get(`/api/clients/search/?${params}`);
    // Handle paginated response
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};

// Get client statistics
export const getClientStats = async () => {
  try {
    const response = await api.get('/api/auth/user-stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching client stats:', error);
    throw error;
  }
}; 