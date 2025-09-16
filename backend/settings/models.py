from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import json

User = get_user_model()


class UserProfileSettings(models.Model):
    """
    User profile settings that are used in invoice headers and general profile information.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile_settings')
    
    # Company/Business Information
    company_name = models.CharField(max_length=200, blank=True, null=True)
    company_email = models.EmailField(blank=True, null=True)
    company_phone = models.CharField(max_length=20, blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)
    company_website = models.URLField(blank=True, null=True)
    company_logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    
    # Invoice Header Customization
    header_custom_text = models.TextField(blank=True, null=True, help_text="Custom text to display in invoice header")
    show_logo_in_header = models.BooleanField(default=True)
    show_contact_in_header = models.BooleanField(default=True)
    show_address_in_header = models.BooleanField(default=True)
    
    # Invoice Defaults
    default_currency = models.CharField(max_length=3, default='KES')
    default_tax_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=16.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    default_payment_terms = models.IntegerField(default=30)  # days
    
    # Invoice Numbering
    invoice_number_prefix = models.CharField(max_length=10, default='INV')
    invoice_number_start = models.IntegerField(default=1000)
    
    # Notification Preferences
    email_notifications = models.BooleanField(default=True)
    invoice_reminders = models.BooleanField(default=True)
    payment_confirmations = models.BooleanField(default=True)
    overdue_alerts = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Profile Settings'
        verbose_name_plural = 'User Profile Settings'
    
    def __str__(self):
        return f"Profile Settings for {self.user.username}"
    
    @classmethod
    def get_user_settings(cls, user):
        """Get or create user profile settings."""
        settings, created = cls.objects.get_or_create(user=user)
        return settings
    
    def get_header_data(self):
        """Get formatted header data for invoices."""
        return {
            'company_name': self.company_name or self.user.company_name or '',
            'company_email': self.company_email or self.user.email or '',
            'company_phone': self.company_phone or self.user.phone or '',
            'company_address': self.company_address or self.user.address or '',
            'company_website': self.company_website or self.user.website or '',
            'company_logo': self.company_logo.url if self.company_logo else None,
            'header_custom_text': self.header_custom_text or '',
            'show_logo': self.show_logo_in_header,
            'show_contact': self.show_contact_in_header,
            'show_address': self.show_address_in_header,
        }


class PlatformSettings(models.Model):
    """
    Platform-wide settings that apply to all users.
    """
    # Platform Configuration
    platform_name = models.CharField(max_length=200, default='Invoice Platform')
    platform_domain = models.CharField(max_length=200, default='localhost:3000')
    support_email = models.EmailField(default='support@example.com')
    admin_email = models.EmailField(default='admin@example.com')
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')
    maintenance_mode = models.BooleanField(default=False)
    registration_enabled = models.BooleanField(default=True)
    max_users_per_org = models.IntegerField(default=100)
    max_invoices_per_month = models.IntegerField(default=1000)
    
    # Security Settings
    require_email_verification = models.BooleanField(default=True)
    require_two_factor = models.BooleanField(default=False)
    session_timeout = models.IntegerField(default=24)  # hours
    password_min_length = models.IntegerField(default=8)
    password_require_special = models.BooleanField(default=True)
    login_attempts = models.IntegerField(default=5)
    lockout_duration = models.IntegerField(default=30)  # minutes
    api_rate_limit = models.IntegerField(default=1000)  # requests per hour
    cors_origins = models.JSONField(default=list)
    
    # Billing Settings
    default_currency = models.CharField(max_length=3, default='USD')
    default_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    grace_period = models.IntegerField(default=7)  # days
    invoice_prefix = models.CharField(max_length=10, default='INV')
    invoice_start_number = models.IntegerField(default=1000)
    payment_terms = models.IntegerField(default=30)  # days
    late_fee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.05)
    stripe_publishable_key = models.CharField(max_length=255, blank=True, null=True)
    stripe_secret_key = models.CharField(max_length=255, blank=True, null=True)
    webhook_secret = models.CharField(max_length=255, blank=True, null=True)
    
    # Email Settings
    smtp_host = models.CharField(max_length=100, blank=True, null=True)
    smtp_port = models.IntegerField(default=587)
    smtp_username = models.EmailField(blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_use_tls = models.BooleanField(default=True)
    from_email = models.EmailField(default='noreply@example.com')
    from_name = models.CharField(max_length=100, default='Invoice Platform')
    email_notifications = models.BooleanField(default=True)
    invoice_reminders = models.BooleanField(default=True)
    payment_confirmations = models.BooleanField(default=True)
    overdue_alerts = models.BooleanField(default=True)
    
    # System Settings
    backup_enabled = models.BooleanField(default=True)
    backup_frequency = models.CharField(max_length=20, default='daily')
    backup_retention = models.IntegerField(default=30)  # days
    log_level = models.CharField(max_length=10, default='INFO')
    debug_mode = models.BooleanField(default=False)
    cache_enabled = models.BooleanField(default=True)
    cache_timeout = models.IntegerField(default=3600)  # seconds
    file_upload_limit = models.IntegerField(default=10)  # MB
    database_optimization = models.BooleanField(default=True)
    
    # Exchange Rate Settings
    exchange_rate_api_key = models.CharField(max_length=255, blank=True, null=True)
    exchange_rate_cache_duration = models.IntegerField(default=3600)  # seconds
    
    # Supported Currencies
    supported_currencies = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Platform Settings'
        verbose_name_plural = 'Platform Settings'
    
    def __str__(self):
        return "Platform Settings"
    
    @classmethod
    def get_settings(cls):
        """Get or create platform settings."""
        settings, created = cls.objects.get_or_create(pk=1)
        if created:
            # Set default supported currencies
            settings.supported_currencies = [
                {'code': 'KES', 'name': 'Kenyan Shilling', 'symbol': 'KSh'},
                {'code': 'USD', 'name': 'US Dollar', 'symbol': '$'},
                {'code': 'EUR', 'name': 'Euro', 'symbol': '€'},
                {'code': 'GBP', 'name': 'British Pound', 'symbol': '£'},
            ]
            settings.save()
        return settings 
    smtp_username = models.EmailField(blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_use_tls = models.BooleanField(default=True)
    from_email = models.EmailField(default='noreply@example.com')
    from_name = models.CharField(max_length=100, default='Invoice Platform')
    email_notifications = models.BooleanField(default=True)
    invoice_reminders = models.BooleanField(default=True)
    payment_confirmations = models.BooleanField(default=True)
    overdue_alerts = models.BooleanField(default=True)
    
    # System Settings
    backup_enabled = models.BooleanField(default=True)
    backup_frequency = models.CharField(max_length=20, default='daily')
    backup_retention = models.IntegerField(default=30)  # days
    log_level = models.CharField(max_length=10, default='INFO')
    debug_mode = models.BooleanField(default=False)
    cache_enabled = models.BooleanField(default=True)
    cache_timeout = models.IntegerField(default=3600)  # seconds
    file_upload_limit = models.IntegerField(default=10)  # MB
    database_optimization = models.BooleanField(default=True)
    
    # Exchange Rate Settings
    exchange_rate_api_key = models.CharField(max_length=255, blank=True, null=True)
    exchange_rate_cache_duration = models.IntegerField(default=3600)  # seconds
    
    # Supported Currencies
    supported_currencies = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Platform Settings'
        verbose_name_plural = 'Platform Settings'
    
    def __str__(self):
        return "Platform Settings"
    
    @classmethod
    def get_settings(cls):
        """Get or create platform settings."""
        settings, created = cls.objects.get_or_create(pk=1)
        if created:
            # Set default supported currencies
            settings.supported_currencies = [
                {'code': 'KES', 'name': 'Kenyan Shilling', 'symbol': 'KSh'},
                {'code': 'USD', 'name': 'US Dollar', 'symbol': '$'},
                {'code': 'EUR', 'name': 'Euro', 'symbol': '€'},
                {'code': 'GBP', 'name': 'British Pound', 'symbol': '£'},
            ]
            settings.save()
        return settings 