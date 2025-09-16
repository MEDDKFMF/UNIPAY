from django.contrib import admin
from .models import UserProfileSettings, PlatformSettings


@admin.register(UserProfileSettings)
class UserProfileSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'default_currency', 'default_tax_rate']
    list_filter = ['default_currency', 'email_notifications', 'invoice_reminders']
    search_fields = ['user__username', 'user__email', 'company_name']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Company Information', {
            'fields': ('company_name', 'company_email', 'company_phone', 'company_address', 'company_website', 'company_logo')
        }),
        ('Invoice Header Customization', {
            'fields': ('header_custom_text', 'show_logo_in_header', 'show_contact_in_header', 'show_address_in_header')
        }),
        ('Invoice Defaults', {
            'fields': ('default_currency', 'default_tax_rate', 'default_payment_terms')
        }),
        ('Invoice Numbering', {
            'fields': ('invoice_number_prefix', 'invoice_number_start')
        }),
        ('Notification Preferences', {
            'fields': ('email_notifications', 'invoice_reminders', 'payment_confirmations', 'overdue_alerts')
        }),
    )
    
    def has_add_permission(self, request):
        # Users can have their own profile settings
        return True


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ['exchange_rate_cache_duration', 'smtp_host', 'smtp_port']
    fieldsets = (
        ('Exchange Rate Settings', {
            'fields': ('exchange_rate_api_key', 'exchange_rate_cache_duration')
        }),
        ('Supported Currencies', {
            'fields': ('supported_currencies',)
        }),
        ('Email Settings', {
            'fields': ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_use_tls')
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one platform settings instance
        return not PlatformSettings.objects.exists() 