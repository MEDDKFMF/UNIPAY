from django.urls import path
from . import views

urlpatterns = [
    # Legacy notification endpoints (for invoice notifications)
    path('send-invoice/', views.send_invoice_notification_view, name='send_invoice_notification'),
    path('send-payment-confirmation/', views.send_payment_confirmation_view, name='send_payment_confirmation'),
    path('send-reminder/', views.send_payment_reminder_view, name='send_payment_reminder'),
    path('templates/', views.MessageTemplateListView.as_view(), name='message_template_list'),
    path('templates/<int:pk>/', views.MessageTemplateDetailView.as_view(), name='message_template_detail'),
    path('invoice-notifications/', views.NotificationListView.as_view(), name='notification_list'),
    path('invoice-notifications/<int:pk>/', views.NotificationDetailView.as_view(), name='notification_detail'),
    path('retry-failed/', views.retry_failed_notifications_view, name='retry_failed_notifications'),
    
    # User notification endpoints
    path('notifications/', views.UserNotificationListView.as_view(), name='user_notification_list'),
    path('notifications/<int:pk>/', views.UserNotificationDetailView.as_view(), name='user_notification_detail'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read_view, name='mark_all_notifications_read'),
    path('notification-stats/', views.notification_stats_view, name='notification_stats'),
    path('send-test-notification/', views.send_test_notification_view, name='send_test_notification'),
    
    # Notification preferences
    path('notification-preferences/', views.NotificationPreferenceView.as_view(), name='notification_preferences'),
] 