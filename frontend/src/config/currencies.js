/**
 * Comprehensive currency configuration for the invoice system
 * Includes all currencies supported by the exchange rate engine
 */

export const CURRENCIES = [
  // Major Global Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'Global' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'UK' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'Japan' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', region: 'Switzerland' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'Australia' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'India' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', region: 'South Korea' },
  
  // African Currencies
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'Kenya' },
  { code: 'KSH', name: 'Kenyan Shilling', symbol: 'KSh', region: 'Kenya' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', region: 'Ghana' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'South Africa' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', region: 'Uganda' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', region: 'Tanzania' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', region: 'Ethiopia' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', region: 'Morocco' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', region: 'Egypt' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', region: 'Tunisia' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', region: 'Algeria' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', region: 'Sudan' },
  
  // European Currencies
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', region: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', region: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', region: 'Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', region: 'Poland' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', region: 'Czech Republic' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', region: 'Hungary' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', region: 'Romania' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', region: 'Bulgaria' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', region: 'Croatia' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', region: 'Russia' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', region: 'Ukraine' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'КМ', region: 'Bosnia' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', region: 'Serbia' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', region: 'Macedonia' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', region: 'Albania' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', region: 'Iceland' },
  
  // Asian Currencies
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', region: 'Singapore' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', region: 'Hong Kong' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', region: 'Taiwan' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', region: 'Thailand' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', region: 'Malaysia' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', region: 'Indonesia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', region: 'Philippines' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', region: 'Vietnam' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', region: 'Bangladesh' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', region: 'Pakistan' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', region: 'Sri Lanka' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', region: 'Nepal' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', region: 'Myanmar' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', region: 'Cambodia' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', region: 'Laos' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', region: 'Mongolia' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', region: 'Kazakhstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв', region: 'Uzbekistan' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', region: 'Tajikistan' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T', region: 'Turkmenistan' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', region: 'Azerbaijan' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', region: 'Georgia' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', region: 'Armenia' },
  
  // Middle Eastern Currencies
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', region: 'Turkey' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', region: 'Israel' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', region: 'Jordan' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', region: 'Lebanon' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س', region: 'Syria' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع', region: 'Iraq' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', region: 'Iran' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', region: 'Afghanistan' },
  
  // American Currencies
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', region: 'Brazil' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', region: 'Mexico' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', region: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', region: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', region: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', region: 'Peru' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', region: 'Uruguay' },
  { code: 'VEF', name: 'Venezuelan Bolivar', symbol: 'Bs', region: 'Venezuela' },
  
  // Other Currencies
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', region: 'Belarus' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', region: 'Moldova' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', region: 'Libya' },
];

// Get currency by code
export const getCurrencyByCode = (code) => {
  return CURRENCIES.find(currency => currency.code === code);
};

// Get currencies by region
export const getCurrenciesByRegion = (region) => {
  return CURRENCIES.filter(currency => currency.region === region);
};

// Get all currency codes
export const getAllCurrencyCodes = () => {
  return CURRENCIES.map(currency => currency.code);
};

// Get popular currencies (most commonly used)
export const getPopularCurrencies = () => {
  return CURRENCIES.filter(currency => 
    ['USD', 'EUR', 'GBP', 'JPY', 'KES', 'NGN', 'GHS', 'ZAR', 'UGX', 'TZS', 'CNY', 'INR', 'AUD', 'CAD'].includes(currency.code)
  );
};

// Format currency display
export const formatCurrencyDisplay = (currency) => {
  return `${currency.code} - ${currency.name} (${currency.symbol})`;
};
