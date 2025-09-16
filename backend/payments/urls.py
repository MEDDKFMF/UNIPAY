"""
URL patterns for payment processing.
"""

from django.urls import path
from .views import (
    PaymentListView,
    UserPaymentListView,
    create_checkout_session,
    stripe_webhook,
    flutterwave_webhook,
    mpesa_callback,
    payment_status,
    create_payment_link,
    PlanListCreateView,
    PlanDetailView,
    SubscriptionListCreateView,
    SubscriptionDetailView,
    admin_metrics,
    admin_analytics_detailed,
    PlanPublicListView,
    get_available_payment_methods,
    test_payment_gateway,
    # New payment method views
    UserPaymentMethodListView,
    UserPaymentMethodDetailView,
    ClientPaymentMethodListView,
    ClientPaymentMethodDetailView,
    # Platform admin views
    PlatformPaymentGatewayListView,
    PlatformPaymentGatewayDetailView
)

urlpatterns = [
    # Payment endpoints
    path('create-checkout/', create_checkout_session, name='create_checkout'),
    path('create-payment-link/', create_payment_link, name='create_payment_link'),
    path('webhook/', stripe_webhook, name='stripe_webhook'),
    path('flutterwave-webhook/', flutterwave_webhook, name='flutterwave_webhook'),
    path('mpesa-callback/', mpesa_callback, name='mpesa_callback'),
    path('status/<int:payment_id>/', payment_status, name='payment_status'),
    path('invoice/<int:invoice_id>/', PaymentListView.as_view(), name='payment_list'),
    path('', UserPaymentListView.as_view(), name='user_payment_list'),
    
    # User Payment Methods (receiving payments)
    path('user-methods/', UserPaymentMethodListView.as_view(), name='user_payment_method_list'),
    path('user-methods/<int:pk>/', UserPaymentMethodDetailView.as_view(), name='user_payment_method_detail'),
    
    # Client Payment Methods (for recurring payments)
    path('client-methods/', ClientPaymentMethodListView.as_view(), name='client_payment_method_list'),
    path('client-methods/<int:pk>/', ClientPaymentMethodDetailView.as_view(), name='client_payment_method_detail'),
    
    # Payment method utilities
    path('available-methods/', get_available_payment_methods, name='available_payment_methods'),
    path('test-gateway/', test_payment_gateway, name='test_payment_gateway'),
    
    # Platform Admin: Gateway Management
    path('admin/gateways/', PlatformPaymentGatewayListView.as_view(), name='platform_gateway_list'),
    path('admin/gateways/<int:pk>/', PlatformPaymentGatewayDetailView.as_view(), name='platform_gateway_detail'),
    
    # Admin: plans
    path('admin/plans/', PlanListCreateView.as_view(), name='plan_list_create'),
    path('admin/plans/<int:pk>/', PlanDetailView.as_view(), name='plan_detail'),
    # Subscriptions
    path('subscriptions/', SubscriptionListCreateView.as_view(), name='subscription_list_create'),
    path('subscriptions/<int:pk>/', SubscriptionDetailView.as_view(), name='subscription_detail'),
    # Admin metrics
    path('admin/metrics/', admin_metrics, name='admin_metrics'),
    path('admin/analytics/detailed/', admin_analytics_detailed, name='admin_analytics_detailed'),
    # Public plans for landing/signup
    path('plans/public/', PlanPublicListView.as_view(), name='plan_public_list'),
]