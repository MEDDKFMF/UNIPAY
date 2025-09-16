"""
URL patterns for exchange rate endpoints.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('rate/', views.exchange_rate_view, name='exchange_rate'),
    path('rates/', views.exchange_rates_view, name='exchange_rates'),
] 