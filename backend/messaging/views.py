from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Notification, MessageTemplate, UserNotification, NotificationPreference
from .serializers import (
    NotificationSerializer, MessageTemplateSerializer,
    UserNotificationSerializer, UserNotificationCreateSerializer, UserNotificationUpdateSerializer,
    NotificationPreferenceSerializer, NotificationPreferenceUpdateSerializer
)
from .services import MessagingService
from .tasks import send_invoice_notification, send_payment_confirmation, send_payment_reminder
from invoices.models import Invoice


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_invoice_notification_view(request):
    """
    Send invoice notification via email, SMS, and WhatsApp
    """
    invoice_id = request.data.get('invoice_id')
    notification_type = request.data.get('notification_type', 'invoice_created')
    
    if not invoice_id:
        return Response({'error': 'invoice_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Check if user has permission to send notifications for this invoice
        if not (request.user.is_admin or request.user.is_accountant or invoice.created_by == request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Trigger async task
        task = send_invoice_notification.delay(invoice_id, notification_type)
        
        return Response({
            'message': 'Notification sent successfully',
            'task_id': task.id
        }, status=status.HTTP_200_OK)
        
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_payment_confirmation_view(request):
    """
    Send payment confirmation notification
    """
    invoice_id = request.data.get('invoice_id')
    
    if not invoice_id:
        return Response({'error': 'invoice_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Check if user has permission
        if not (request.user.is_admin or request.user.is_accountant or invoice.created_by == request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Trigger async task
        task = send_payment_confirmation.delay(invoice_id)
        
        return Response({
            'message': 'Payment confirmation sent successfully',
            'task_id': task.id
        }, status=status.HTTP_200_OK)
        
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_payment_reminder_view(request):
    """
    Send payment reminder notification
    """
    invoice_id = request.data.get('invoice_id')
    
    if not invoice_id:
        return Response({'error': 'invoice_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Check if user has permission
        if not (request.user.is_admin or request.user.is_accountant or invoice.created_by == request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Trigger async task
        task = send_payment_reminder.delay(invoice_id)
        
        return Response({
            'message': 'Payment reminder sent successfully',
            'task_id': task.id
        }, status=status.HTTP_200_OK)
        
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def retry_failed_notifications_view(request):
    """
    Retry failed notifications
    """
    if not (request.user.is_admin or request.user.is_accountant):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .tasks import retry_failed_notifications
        task = retry_failed_notifications.delay()
        
        return Response({
            'message': 'Retry task initiated',
            'task_id': task.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MessageTemplateListView(generics.ListCreateAPIView):
    """
    List and create message templates
    """
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin or self.request.user.is_accountant:
            return MessageTemplate.objects.all()
        return MessageTemplate.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save()


class MessageTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete message templates
    """
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin or self.request.user.is_accountant:
            return MessageTemplate.objects.all()
        return MessageTemplate.objects.filter(is_active=True)


class NotificationListView(generics.ListAPIView):
    """
    List notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_accountant:
            return Notification.objects.all()
        
        # For regular users, show notifications for their invoices
        return Notification.objects.filter(invoice__created_by=user)


class NotificationDetailView(generics.RetrieveAPIView):
    """
    Retrieve notification details
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_accountant:
            return Notification.objects.all()
        
        # For regular users, show notifications for their invoices
        return Notification.objects.filter(invoice__created_by=user) 


# User Notification Views
class UserNotificationListView(generics.ListCreateAPIView):
    """
    List and create user notifications
    """
    serializer_class = UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserNotificationCreateSerializer
        return UserNotificationSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserNotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete user notifications
    """
    serializer_class = UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return UserNotificationUpdateSerializer
        return UserNotificationSerializer
    
    def perform_update(self, serializer):
        if serializer.validated_data.get('is_read') and not self.get_object().is_read:
            serializer.save(read_at=timezone.now())
        else:
            serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read_view(request):
    """
    Mark all notifications as read for the current user
    """
    try:
        UserNotification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        
        return Response({
            'message': 'All notifications marked as read'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats_view(request):
    """
    Get notification statistics for the current user
    """
    try:
        user = request.user
        total_notifications = UserNotification.objects.filter(user=user).count()
        unread_notifications = UserNotification.objects.filter(user=user, is_read=False).count()
        
        # Count by type
        type_counts = {}
        for notification_type, _ in UserNotification.NOTIFICATION_TYPE_CHOICES:
            count = UserNotification.objects.filter(user=user, type=notification_type).count()
            type_counts[notification_type] = count
        
        return Response({
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'type_counts': type_counts
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Notification Preferences Views
class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update notification preferences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        preference, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preference
    
    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return NotificationPreferenceUpdateSerializer
        return NotificationPreferenceSerializer


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_test_notification_view(request):
    """
    Send a test notification to the current user
    """
    try:
        notification_type = request.data.get('type', 'system_update')
        data = request.data.get('data', {})
        message = request.data.get('message', f'Test {notification_type} notification')
        
        # Create test notification
        notification = UserNotification.objects.create(
            user=request.user,
            type=notification_type,
            title=f'Test {notification_type.replace("_", " ").title()}',
            message=message,
            data=data
        )
        
        serializer = UserNotificationSerializer(notification)
        
        return Response({
            'message': 'Test notification sent successfully',
            'notification': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)