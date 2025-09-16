// Currency utilities for multi-currency support

export const CURRENCIES = [
  { code: 'KSH', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
];

export const DEFAULT_CURRENCY = 'KSH';

export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : currencyCode;
};

export const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY) => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol} ${parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCurrencyWithoutSymbol = (amount, currencyCode = DEFAULT_CURRENCY) => {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getCurrencyOptions = () => {
  return CURRENCIES.map(currency => ({
    value: currency.code,
    label: `${currency.name} (${currency.code})`,
    symbol: currency.symbol,
  }));
};

export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate = 1) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  return amount * exchangeRate;
}; 