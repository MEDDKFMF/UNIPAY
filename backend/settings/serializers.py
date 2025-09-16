from rest_framework import serializers
from .models import UserProfileSettings, PlatformSettings


class UserProfileSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile settings.
    """
    user = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = UserProfileSettings
        fields = [
            'id', 'user', 'company_name', 'company_email', 'company_phone', 
            'company_address', 'company_website', 'company_logo',
            'header_custom_text', 'show_logo_in_header', 'show_contact_in_header', 
            'show_address_in_header', 'default_currency', 'default_tax_rate',
            'default_payment_terms', 'invoice_number_prefix', 'invoice_number_start',
            'email_notifications', 'invoice_reminders', 'payment_confirmations', 
            'overdue_alerts', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserProfileSettingsUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile settings.
    """
    class Meta:
        model = UserProfileSettings
        fields = [
            'company_name', 'company_email', 'company_phone', 'company_address', 
            'company_website', 'header_custom_text', 'show_logo_in_header', 
            'show_contact_in_header', 'show_address_in_header', 'default_currency', 
            'default_tax_rate', 'default_payment_terms', 'invoice_number_prefix', 
            'invoice_number_start', 'email_notifications', 'invoice_reminders', 
            'payment_confirmations', 'overdue_alerts'
        ]


class PlatformSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for platform settings (read-only for users).
    """
    class Meta:
        model = PlatformSettings
        fields = [
            'id', 'platform_name', 'platform_domain', 'support_email', 'admin_email',
            'timezone', 'language', 'maintenance_mode', 'registration_enabled',
            'max_users_per_org', 'max_invoices_per_month', 'require_email_verification',
            'require_two_factor', 'session_timeout', 'password_min_length',
            'password_require_special', 'login_attempts', 'lockout_duration',
            'api_rate_limit', 'cors_origins', 'default_currency', 'default_tax_rate',
            'grace_period', 'invoice_prefix', 'invoice_start_number', 'payment_terms',
            'late_fee_rate', 'stripe_publishable_key', 'stripe_secret_key',
            'webhook_secret', 'smtp_host', 'smtp_port', 'smtp_username',
            'smtp_password', 'smtp_use_tls', 'from_email', 'from_name',
            'email_notifications', 'invoice_reminders', 'payment_confirmations',
            'overdue_alerts', 'backup_enabled', 'backup_frequency', 'backup_retention',
            'log_level', 'debug_mode', 'cache_enabled', 'cache_timeout',
            'file_upload_limit', 'database_optimization', 'exchange_rate_api_key',
            'exchange_rate_cache_duration', 'supported_currencies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlatformSettingsUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating platform settings (admin only).
    """
    class Meta:
        model = PlatformSettings
        fields = [
            'platform_name', 'platform_domain', 'support_email', 'admin_email',
            'timezone', 'language', 'maintenance_mode', 'registration_enabled',
            'max_users_per_org', 'max_invoices_per_month', 'require_email_verification',
            'require_two_factor', 'session_timeout', 'password_min_length',
            'password_require_special', 'login_attempts', 'lockout_duration',
            'api_rate_limit', 'cors_origins', 'default_currency', 'default_tax_rate',
            'grace_period', 'invoice_prefix', 'invoice_start_number', 'payment_terms',
            'late_fee_rate', 'stripe_publishable_key', 'stripe_secret_key',
            'webhook_secret', 'smtp_host', 'smtp_port', 'smtp_username',
            'smtp_password', 'smtp_use_tls', 'from_email', 'from_name',
            'email_notifications', 'invoice_reminders', 'payment_confirmations',
            'overdue_alerts', 'backup_enabled', 'backup_frequency', 'backup_retention',
            'log_level', 'debug_mode', 'cache_enabled', 'cache_timeout',
            'file_upload_limit', 'database_optimization', 'exchange_rate_api_key',
            'exchange_rate_cache_duration', 'supported_currencies'
        ]
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'stripe_secret_key': {'write_only': True},
            'webhook_secret': {'write_only': True}
        } 