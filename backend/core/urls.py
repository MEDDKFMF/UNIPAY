"""
URL configuration for invoice platform.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/clients/', include('accounts.urls_client')),
    path('api/payments/', include('payments.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/settings/', include('settings.urls')),
    path('api/exchange-rates/rate/', views.exchange_rate_view, name='exchange_rate'),
    path('api/exchange-rates/rates/', views.exchange_rates_view, name='exchange_rates'),
    path('api/exchange-rates/currencies/', views.available_currencies_view, name='available_currencies'),
    path('api/exchange-rates/refresh/', views.refresh_rates_view, name='refresh_rates'),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 