"""
Exchange rate service for real-time currency conversion.
"""

import requests
import logging
from decimal import Decimal
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

# Open Exchange Rates API with your app ID
OPEN_EXCHANGE_RATES_API_KEY = '06d10eb32899450886a5e46031c2df36'
OPEN_EXCHANGE_RATES_URL = f'https://open.er-api.com/v6/latest/USD?apikey={OPEN_EXCHANGE_RATES_API_KEY}'

# Fallback APIs if Open Exchange Rates fails
FALLBACK_APIS = [
    'https://api.exchangerate-api.com/v4/latest/USD',
    'https://api.exchangerate.host/latest?base=USD',
    'https://api.frankfurter.app/latest?from=USD'
]

CACHE_KEY = 'exchange_rates'
CACHE_DURATION = 300  # 5 minutes

# Current market rates (as of 2024) - these are fallbacks only
FALLBACK_RATES = {
    'KSH': Decimal('160.0000'),  # Current rate: ~160 KSH per USD
    'USD': Decimal('1.0000'),
    'EUR': Decimal('0.8500'),
    'GBP': Decimal('0.7500'),
    'NGN': Decimal('1600.0000'),
    'GHS': Decimal('13.5000'),
    'ZAR': Decimal('19.0000'),
    'UGX': Decimal('3800.0000'),
    'TZS': Decimal('2600.0000'),
    'KES': Decimal('160.0000'),
    'CNY': Decimal('7.2000'),
    'JPY': Decimal('150.0000'),
    'INR': Decimal('83.0000'),
    'AUD': Decimal('1.5200'),
    'CAD': Decimal('1.3500'),
    'CHF': Decimal('0.8800'),
    'SEK': Decimal('10.5000'),
    'NOK': Decimal('10.8000'),
    'DKK': Decimal('6.9000'),
    'PLN': Decimal('4.2000'),
    'CZK': Decimal('23.5000'),
    'HUF': Decimal('360.0000'),
    'RON': Decimal('4.6000'),
    'BGN': Decimal('1.8000'),
    'HRK': Decimal('7.0000'),
    'RUB': Decimal('95.0000'),
    'TRY': Decimal('32.0000'),
    'BRL': Decimal('5.2000'),
    'MXN': Decimal('17.5000'),
    'ARS': Decimal('350.0000'),
    'CLP': Decimal('950.0000'),
    'COP': Decimal('4000.0000'),
    'PEN': Decimal('3.8000'),
    'UYU': Decimal('40.0000'),
    'VEF': Decimal('0.0000'),
    'KRW': Decimal('1300.0000'),
    'SGD': Decimal('1.3500'),
    'HKD': Decimal('7.8000'),
    'TWD': Decimal('31.5000'),
    'THB': Decimal('35.5000'),
    'MYR': Decimal('4.7000'),
    'IDR': Decimal('15500.0000'),
    'PHP': Decimal('55.5000'),
    'VND': Decimal('24000.0000'),
    'BDT': Decimal('110.0000'),
    'PKR': Decimal('280.0000'),
    'LKR': Decimal('320.0000'),
    'NPR': Decimal('130.0000'),
    'MMK': Decimal('2100.0000'),
    'KHR': Decimal('4100.0000'),
    'LAK': Decimal('20000.0000'),
    'MNT': Decimal('3400.0000'),
    'KZT': Decimal('470.0000'),
    'UZS': Decimal('12500.0000'),
    'TJS': Decimal('11.0000'),
    'TMT': Decimal('3.5000'),
    'AZN': Decimal('1.7000'),
    'GEL': Decimal('2.7000'),
    'AMD': Decimal('400.0000'),
    'BYN': Decimal('3.2000'),
    'MDL': Decimal('18.0000'),
    'UAH': Decimal('40.5000'),
    'BAM': Decimal('1.8000'),
    'RSD': Decimal('108.0000'),
    'MKD': Decimal('61.0000'),
    'ALL': Decimal('95.0000'),
    'ISK': Decimal('140.0000'),
    'MAD': Decimal('10.0000'),
    'EGP': Decimal('31.0000'),
    'TND': Decimal('3.1000'),
    'LYD': Decimal('4.8000'),
    'DZD': Decimal('135.0000'),
    'SDG': Decimal('600.0000'),
    'ETB': Decimal('56.0000'),
}

def fetch_from_open_exchange_rates():
    """Fetch exchange rates from Open Exchange Rates API."""
    try:
        response = requests.get(OPEN_EXCHANGE_RATES_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'rates' in data:
            rates = data['rates']
            # Convert to our format with USD as base
            result = {'USD': Decimal('1.0000')}
            for currency, rate in rates.items():
                # Map KES to KSH for consistency
                if currency == 'KES':
                    result['KSH'] = Decimal(str(rate))
                elif currency in FALLBACK_RATES:
                    result[currency] = Decimal(str(rate))
            return result
        else:
            logger.error("Open Exchange Rates API response format unexpected")
            return None
    except Exception as e:
        logger.error(f"Error fetching from Open Exchange Rates API: {e}")
        return None

def fetch_from_api(api_url):
    """Fetch exchange rates from a fallback API endpoint."""
    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Handle different API response formats
        if 'rates' in data:
            rates = data['rates']
        elif 'conversion_rates' in data:
            rates = data['conversion_rates']
        else:
            rates = data
            
        # Convert to our format with USD as base
        result = {'USD': Decimal('1.0000')}
        for currency, rate in rates.items():
            if currency in FALLBACK_RATES:
                result[currency] = Decimal(str(rate))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching from {api_url}: {e}")
        return None

def get_exchange_rates():
    """Get current exchange rates from API or cache."""
    cached_rates = cache.get(CACHE_KEY)
    if cached_rates:
        return cached_rates
    
    # First try Open Exchange Rates API (most reliable)
    rates = fetch_from_open_exchange_rates()
    if rates and len(rates) > 1:
        cache.set(CACHE_KEY, rates, CACHE_DURATION)
        logger.info("Successfully fetched rates from Open Exchange Rates API")
        return rates
    
    # If Open Exchange Rates fails, try fallback APIs
    for api_url in FALLBACK_APIS:
        rates = fetch_from_api(api_url)
        if rates and len(rates) > 1:
            cache.set(CACHE_KEY, rates, CACHE_DURATION)
            logger.info(f"Successfully fetched rates from fallback API: {api_url}")
            return rates
    
    # If all APIs fail, return fallback rates
    logger.warning("All exchange rate APIs failed, using fallback rates")
    return FALLBACK_RATES

def get_exchange_rate(from_currency, to_currency='KSH'):
    """Get exchange rate between two currencies."""
    if from_currency == to_currency:
        return Decimal('1.0000')
    
    rates = get_exchange_rates()
    
    # Convert to KSH (our base currency)
    if from_currency == 'USD':
        # Direct conversion from USD to KSH
        return rates.get('KSH', Decimal('160.0000'))
    elif from_currency == 'KSH':
        # 1 KSH = 1 KSH
        return Decimal('1.0000')
    else:
        # For other currencies, convert via USD
        from_rate = rates.get(from_currency, Decimal('1.0000'))
        ksh_rate = rates.get('KSH', Decimal('160.0000'))
        return ksh_rate / from_rate

def get_available_currencies():
    """Get list of available currencies."""
    rates = get_exchange_rates()
    return list(rates.keys())

def refresh_exchange_rates():
    """Force refresh of exchange rates."""
    cache.delete(CACHE_KEY)
    return get_exchange_rates() 