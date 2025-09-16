"""
Core views for exchange rates and utilities.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .exchange_rates import get_exchange_rate, get_exchange_rates, get_available_currencies, refresh_exchange_rates


@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    """
    API information endpoint.
    """
    return Response({
        'message': 'UniPay Invoice Platform API',
        'version': '1.0.0',
        'status': 'active',
        'endpoints': {
            'authentication': '/api/auth/',
            'invoices': '/api/invoices/',
            'clients': '/api/clients/',
            'payments': '/api/payments/',
            'messaging': '/api/messaging/',
            'settings': '/api/settings/',
            'exchange_rates': '/api/exchange-rates/',
            'admin': '/admin/'
        },
        'documentation': 'https://github.com/MEDDKFMF/unipay',
        'frontend_url': 'https://unipay-frontend.onrender.com'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def exchange_rate_view(request):
    """
    Get exchange rate between currencies.
    """
    from_currency = request.GET.get('from', 'USD')
    to_currency = request.GET.get('to', 'KSH')
    
    try:
        rate = get_exchange_rate(from_currency, to_currency)
        return Response({
            'from_currency': from_currency,
            'to_currency': to_currency,
            'rate': float(rate),
            'formatted_rate': f"1 {from_currency} = {rate:.4f} {to_currency}",
            'timestamp': '2024-01-01T00:00:00Z'  # Add timestamp for real-time indication
        })
    except Exception as e:
        return Response(
            {'error': 'Failed to get exchange rate'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def exchange_rates_view(request):
    """
    Get all exchange rates.
    """
    try:
        rates = get_exchange_rates()
        return Response({
            'rates': {k: float(v) for k, v in rates.items()},
            'base_currency': 'KSH',
            'total_currencies': len(rates),
            'timestamp': '2024-01-01T00:00:00Z'
        })
    except Exception as e:
        return Response(
            {'error': 'Failed to get exchange rates'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_currencies_view(request):
    """
    Get list of available currencies.
    """
    try:
        currencies = get_available_currencies()
        return Response({
            'currencies': currencies,
            'total': len(currencies),
            'base_currency': 'KSH'
        })
    except Exception as e:
        return Response(
            {'error': 'Failed to get available currencies'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_rates_view(request):
    """
    Force refresh of exchange rates.
    """
    try:
        rates = refresh_exchange_rates()
        return Response({
            'message': 'Exchange rates refreshed successfully',
            'rates': {k: float(v) for k, v in rates.items()},
            'total_currencies': len(rates),
            'timestamp': '2024-01-01T00:00:00Z'
        })
    except Exception as e:
        return Response(
            {'error': 'Failed to refresh exchange rates'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 