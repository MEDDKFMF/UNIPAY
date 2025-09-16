"""
Admin interface for user and client management.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Client, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model.
    """
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_verified']
    list_filter = ['role', 'is_active', 'is_verified', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'company_name', 'address', 'is_verified')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'company_name', 'address')}),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Admin interface for Client model.
    """
    list_display = ['name', 'email', 'company_name', 'phone', 'is_active', 'created_by', 'created_at']
    list_filter = ['is_active', 'created_at', 'created_by']
    search_fields = ['name', 'email', 'company_name', 'phone']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'phone', 'company_name')
        }),
        ('Address & Tax', {
            'fields': ('address', 'tax_id')
        }),
        ('Additional Info', {
            'fields': ('notes', 'is_active', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ) 


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_key_short', 'ip_address', 'device_type', 'browser', 'status', 'last_activity', 'duration_display']
    list_filter = ['status', 'device_type', 'browser', 'os', 'created_at', 'last_activity']
    search_fields = ['user__username', 'user__email', 'ip_address', 'session_key']
    readonly_fields = ['session_key', 'created_at', 'last_activity', 'duration_display']
    actions = ['terminate_sessions', 'mark_suspicious', 'mark_expired']
    
    def session_key_short(self, obj):
        return f"{obj.session_key[:8]}..."
    session_key_short.short_description = 'Session Key'
    
    def duration_display(self, obj):
        duration = obj.duration
        if duration:
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "N/A"
    duration_display.short_description = 'Duration'
    
    def terminate_sessions(self, request, queryset):
        updated = queryset.update(
            status='terminated',
            is_terminated=True,
            termination_reason='Admin terminated'
        )
        self.message_user(request, f'{updated} sessions were terminated.')
    terminate_sessions.short_description = "Terminate selected sessions"
    
    def mark_suspicious(self, request, queryset):
        updated = queryset.update(status='suspicious')
        self.message_user(request, f'{updated} sessions were marked as suspicious.')
    mark_suspicious.short_description = "Mark selected sessions as suspicious"
    
    def mark_expired(self, request, queryset):
        updated = queryset.update(status='expired')
        self.message_user(request, f'{updated} sessions were marked as expired.')
    mark_expired.short_description = "Mark selected sessions as expired" 