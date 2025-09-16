"""
URL patterns for authentication.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserUpdateView,
    logout_view,
    user_stats_view,
    change_password_view,
    upload_avatar_view,
    admin_user_list_view,
    admin_user_detail_view,
    admin_organization_list_view,
    admin_organization_detail_view,
    SessionListView,
    SessionDetailView,
    SessionTerminationView,
    SessionBulkActionView,
    SessionMetricsView,
    RealTimeSessionView,
    SecurityAlertsView
)

urlpatterns = [
    # Authentication endpoints
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('logout/', logout_view, name='logout'),
    
    # User profile endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', UserUpdateView.as_view(), name='user_update'),
    path('change-password/', change_password_view, name='change_password'),
    path('upload-avatar/', upload_avatar_view, name='upload_avatar'),
    path('stats/', user_stats_view, name='user_stats'),
    # Admin user management
    path('admin/users/', admin_user_list_view, name='admin_user_list'),
    path('admin/users/<int:user_id>/', admin_user_detail_view, name='admin_user_detail'),
    path('admin/organizations/', admin_organization_list_view, name='admin_organization_list'),
    path('admin/organizations/<int:org_id>/', admin_organization_detail_view, name='admin_organization_detail'),
    # Session Management
    path('admin/sessions/', SessionListView.as_view(), name='admin_sessions'),
    path('admin/sessions/<int:session_id>/', SessionDetailView.as_view(), name='admin_session_detail'),
    path('admin/sessions/terminate/', SessionTerminationView.as_view(), name='admin_terminate_sessions'),
    path('admin/sessions/bulk-action/', SessionBulkActionView.as_view(), name='admin_bulk_action_sessions'),
    path('admin/sessions/metrics/', SessionMetricsView.as_view(), name='admin_session_metrics'),
    path('admin/sessions/realtime/', RealTimeSessionView.as_view(), name='admin_realtime_sessions'),
    path('admin/security-alerts/', SecurityAlertsView.as_view(), name='admin_security_alerts'),
] 