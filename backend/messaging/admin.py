from django.contrib import admin
from .models import Notification, MessageTemplate


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'invoice', 'notification_type', 'recipient', 'status',
        'sent_at', 'created_at'
    ]
    list_filter = [
        'notification_type', 'status', 'sent_at', 'created_at'
    ]
    search_fields = [
        'invoice__invoice_number', 'recipient', 'subject', 'message'
    ]
    readonly_fields = ['id', 'created_at', 'sent_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('invoice', 'notification_type', 'recipient')
        }),
        ('Content', {
            'fields': ('subject', 'message')
        }),
        ('Status', {
            'fields': ('status', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'sent_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'template_type', 'is_active', 'created_at'
    ]
    list_filter = [
        'template_type', 'is_active', 'created_at'
    ]
    search_fields = [
        'name', 'subject', 'email_template', 'sms_template', 'whatsapp_template'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'template_type', 'is_active')
        }),
        ('Email Template', {
            'fields': ('subject', 'email_template'),
            'classes': ('collapse',)
        }),
        ('SMS Template', {
            'fields': ('sms_template',),
            'classes': ('collapse',)
        }),
        ('WhatsApp Template', {
            'fields': ('whatsapp_template',),
            'classes': ('collapse',)
        }),
        ('Variables', {
            'fields': ('variables',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('template_type',)
        return self.readonly_fields 