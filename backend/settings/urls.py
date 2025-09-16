from django.urls import path
from . import views

app_name = 'settings'

urlpatterns = [
    # User Profile Settings
    path('profile/', views.get_user_profile_settings, name='get_user_profile_settings'),
    path('profile/update/', views.update_user_profile_settings, name='update_user_profile_settings'),
    path('profile/header/', views.get_invoice_header_data, name='get_invoice_header_data'),
    
    # Platform Settings (read-only for users, admin can update)
    path('platform/', views.get_platform_settings, name='get_platform_settings'),
    path('platform/update/', views.update_platform_settings, name='update_platform_settings'),
    
    # Utility endpoints
    path('currencies/', views.get_supported_currencies, name='get_supported_currencies'),
    path('test-email/', views.test_email_settings, name='test_email_settings'),
] 