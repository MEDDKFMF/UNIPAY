// Exchange rate service for real-time currency conversion
import api from './api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get real-time exchange rates
export const getExchangeRates = async () => {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (exchangeRatesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return exchangeRatesCache;
  }

  try {
    const response = await api.get('/api/exchange-rates/rates/');
    const rates = response.data.rates;

    // Cache the rates
    exchangeRatesCache = rates;
    cacheTimestamp = now;
    
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    return {
      KSH: 1,
      USD: 0.007,
      EUR: 0.006,
      GBP: 0.005,
      NGN: 3.5,
      GHS: 0.08,
      ZAR: 0.13,
      UGX: 25,
      TZS: 17,
      KES: 1,
    };
  }
};

// Get exchange rate for a specific currency
export const getExchangeRate = async (fromCurrency, toCurrency = 'KSH') => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/exchange-rates/rate/?from=${fromCurrency}&to=${toCurrency}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    
    const data = await response.json();
    return data.rate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return 1; // Fallback to 1:1 ratio
  }
};

// Get available currencies
export const getAvailableCurrencies = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/exchange-rates/currencies/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch available currencies');
    }
    
    const data = await response.json();
    return data.currencies;
  } catch (error) {
    console.error('Error getting available currencies:', error);
    return ['KSH', 'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'UGX', 'TZS', 'KES'];
  }
};

// Convert amount between currencies
export const convertCurrency = async (amount, fromCurrency, toCurrency = 'KSH') => {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

// Get formatted exchange rate display
export const getFormattedExchangeRate = async (fromCurrency, toCurrency = 'KSH') => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/exchange-rates/rate/?from=${fromCurrency}&to=${toCurrency}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    
    const data = await response.json();
    return data.formatted_rate;
  } catch (error) {
    console.error('Error getting formatted exchange rate:', error);
    return `1 ${fromCurrency} = 1.0000 ${toCurrency}`;
  }
};

// Refresh exchange rates
export const refreshExchangeRates = async () => {
  try {
    const response = await api.post('/api/exchange-rates/refresh/');
    
    // Update cache
    exchangeRatesCache = response.data.rates;
    cacheTimestamp = Date.now();
    
    return response.data.rates;
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    throw error;
  }
};

// Update exchange rates cache
export const clearExchangeRatesCache = () => {
  exchangeRatesCache = null;
  cacheTimestamp = null;
}; 