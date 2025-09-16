"""
Services for settings integration with invoice generation.
"""

from .models import UserProfileSettings, PlatformSettings


def get_user_profile_settings(user):
    """Get user profile settings for invoice generation."""
    return UserProfileSettings.get_user_settings(user)


def get_platform_settings():
    """Get platform settings."""
    return PlatformSettings.get_settings()


def apply_invoice_defaults(invoice_data, user):
    """Apply settings defaults to invoice data."""
    try:
        user_settings = get_user_profile_settings(user)
        
        # Apply user defaults
        if not invoice_data.get('currency'):
            invoice_data['currency'] = user_settings.default_currency
        
        if not invoice_data.get('tax_rate'):
            invoice_data['tax_rate'] = user_settings.default_tax_rate
        
        # Note: discount_rate is not in UserProfileSettings, so we'll use a default
        if not invoice_data.get('discount_rate'):
            invoice_data['discount_rate'] = 0.00
            
    except Exception as e:
        # Fallback to defaults if settings not available
        if not invoice_data.get('currency'):
            invoice_data['currency'] = 'KES'
        if not invoice_data.get('tax_rate'):
            invoice_data['tax_rate'] = 16.00
        if not invoice_data.get('discount_rate'):
            invoice_data['discount_rate'] = 0.00
    
    return invoice_data


def get_invoice_template_settings(user):
    """Get invoice template settings for PDF generation."""
    try:
        user_settings = get_user_profile_settings(user)
        return {
            'company_name': user_settings.company_name,
            'company_email': user_settings.company_email,
            'company_phone': user_settings.company_phone,
            'company_address': user_settings.company_address,
            'company_website': user_settings.company_website,
            'header_custom_text': user_settings.header_custom_text,
            'show_logo_in_header': user_settings.show_logo_in_header,
            'show_contact_in_header': user_settings.show_contact_in_header,
            'show_address_in_header': user_settings.show_address_in_header,
        }
    except Exception as e:
        # Return defaults if settings not available
        return {
            'company_name': 'UniPay',
            'company_email': 'info@unipay.com',
            'company_phone': '',
            'company_address': '',
            'company_website': '',
            'header_custom_text': '',
            'show_logo_in_header': True,
            'show_contact_in_header': True,
            'show_address_in_header': True,
        }


def get_currency_settings():
    """Get currency settings."""
    try:
        platform_settings = get_platform_settings()
        return {
            'supported_currencies': platform_settings.supported_currencies,
            'exchange_rate_api_key': platform_settings.exchange_rate_api_key,
            'exchange_rate_cache_duration': platform_settings.exchange_rate_cache_duration,
        }
    except Exception as e:
        # Return defaults if settings not available
        return {
            'supported_currencies': [
                {'code': 'KES', 'name': 'Kenyan Shilling', 'symbol': 'KSh'},
                {'code': 'USD', 'name': 'US Dollar', 'symbol': '$'},
                {'code': 'EUR', 'name': 'Euro', 'symbol': '€'},
                {'code': 'GBP', 'name': 'British Pound', 'symbol': '£'},
            ],
            'exchange_rate_api_key': '',
            'exchange_rate_cache_duration': 3600,
        }


def get_email_settings():
    """Get email settings."""
    try:
        platform_settings = get_platform_settings()
        return {
            'smtp_host': platform_settings.smtp_host,
            'smtp_port': platform_settings.smtp_port,
            'smtp_username': platform_settings.smtp_username,
            'smtp_password': platform_settings.smtp_password,
            'smtp_use_tls': platform_settings.smtp_use_tls,
        }
    except Exception as e:
        # Return defaults if settings not available
        return {
            'smtp_host': '',
            'smtp_port': 587,
            'smtp_username': '',
            'smtp_password': '',
            'smtp_use_tls': True,
        }


def get_notification_settings(user):
    """Get notification settings for a user."""
    try:
        user_settings = get_user_profile_settings(user)
        return {
            'email_notifications': user_settings.email_notifications,
            'invoice_reminders': user_settings.invoice_reminders,
            'payment_confirmations': user_settings.payment_confirmations,
            'overdue_alerts': user_settings.overdue_alerts,
        }
    except Exception as e:
        # Return defaults if settings not available
        return {
            'email_notifications': True,
            'invoice_reminders': True,
            'payment_confirmations': True,
            'overdue_alerts': True,
        } 