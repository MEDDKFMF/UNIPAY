from rest_framework import serializers
from .models import Notification, MessageTemplate, UserNotification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model
    """
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    client_name = serializers.CharField(source='invoice.client.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'invoice', 'invoice_number', 'client_name', 'notification_type',
            'recipient', 'subject', 'message', 'status', 'sent_at', 'error_message',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at']


class MessageTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for MessageTemplate model
    """
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'name', 'template_type', 'subject', 'email_template',
            'sms_template', 'whatsapp_template', 'is_active', 'variables'
        ]
    
    def validate(self, data):
        """
        Validate that at least one template type is provided
        """
        if not any([
            data.get('email_template'),
            data.get('sms_template'),
            data.get('whatsapp_template')
        ]):
            raise serializers.ValidationError(
                "At least one template type (email, SMS, or WhatsApp) must be provided."
            )
        return data


class MessageTemplateCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating MessageTemplate
    """
    class Meta:
        model = MessageTemplate
        fields = [
            'name', 'template_type', 'subject', 'email_template',
            'sms_template', 'whatsapp_template', 'is_active', 'variables'
        ]


class MessageTemplateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating MessageTemplate
    """
    class Meta:
        model = MessageTemplate
        fields = [
            'name', 'template_type', 'subject', 'email_template',
            'sms_template', 'whatsapp_template', 'is_active', 'variables'
        ]
        extra_kwargs = {
            'template_type': {'read_only': True}
        }


class UserNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for UserNotification model
    """
    class Meta:
        model = UserNotification
        fields = [
            'id', 'type', 'title', 'message', 'data', 'is_read', 
            'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class UserNotificationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating UserNotification
    """
    class Meta:
        model = UserNotification
        fields = ['type', 'title', 'message', 'data']


class UserNotificationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating UserNotification (mark as read)
    """
    class Meta:
        model = UserNotification
        fields = ['is_read']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationPreference model
    """
    class Meta:
        model = NotificationPreference
        fields = [
            'email_notifications', 'push_notifications', 'sms_notifications',
            'invoice_created', 'invoice_paid', 'invoice_overdue', 
            'payment_received', 'client_created', 'system_update', 'error',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class NotificationPreferenceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating NotificationPreference
    """
    class Meta:
        model = NotificationPreference
        fields = [
            'email_notifications', 'push_notifications', 'sms_notifications',
            'invoice_created', 'invoice_paid', 'invoice_overdue', 
            'payment_received', 'client_created', 'system_update', 'error',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'
        ]