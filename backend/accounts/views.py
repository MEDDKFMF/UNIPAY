"""
Views for user authentication and client management.
"""

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.db.models import Q
from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, EmptyPage
from .models import Client, Organization, UserSession
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
    ClientSerializer,
    ClientCreateSerializer,
    LoginSerializer,
    UserSessionSerializer,
    SessionTerminationSerializer,
    SessionBulkActionSerializer
)

User = get_user_model()


class IsPlatformAdmin(permissions.BasePermission):
    """
    Custom permission to only allow platform admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'is_platform_admin') and
            request.user.is_platform_admin
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain pair view with additional user info.
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    User registration endpoint.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def put(self, request, *args, **kwargs):
        """Override put method to add debugging"""
        print(f"Profile update request data: {request.data}")
        try:
            return super().put(request, *args, **kwargs)
        except Exception as e:
            print(f"Profile update error: {e}")
            raise


class UserUpdateView(generics.UpdateAPIView):
    """
    Update user profile.
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Change user password.
    """
    try:
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([current_password, new_password, confirm_password]):
            return Response({
                'message': 'All password fields are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'message': 'New passwords do not match.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'message': 'Password must be at least 8 characters long.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        if not check_password(current_password, request.user.password):
            return Response({
                'message': 'Current password is incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        
        return Response({
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'message': 'An error occurred while changing password.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar_view(request):
    """
    Upload user avatar.
    """
    try:
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({
                'message': 'No avatar file provided.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif']
        if avatar.content_type not in allowed_types:
            return Response({
                'message': 'Invalid file type. Please upload a JPEG, PNG, or GIF image.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if avatar.size > 5 * 1024 * 1024:
            return Response({
                'message': 'File size too large. Please upload an image smaller than 5MB.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save avatar
        request.user.avatar = avatar
        request.user.save()
        
        return Response({
            'message': 'Avatar uploaded successfully.',
            'avatar_url': request.user.avatar.url if request.user.avatar else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'message': 'An error occurred while uploading avatar.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint that blacklists the refresh token.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ClientListView(generics.ListCreateAPIView):
    """
    List and create clients.
    """
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_platform_admin', False) or user.is_admin or user.is_accountant:
            return Client.objects.all()
        return Client.objects.filter(created_by=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClientCreateSerializer
        return ClientSerializer


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete client.
    """
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_platform_admin', False) or user.is_admin or user.is_accountant:
            return Client.objects.all()
        return Client.objects.filter(created_by=user)


class ClientSearchView(generics.ListAPIView):
    """
    Search clients by name, email, or company name.
    """
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Client.objects.all()
        
        if not (getattr(user, 'is_platform_admin', False) or user.is_admin or user.is_accountant):
            queryset = queryset.filter(created_by=user)
        
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(company_name__icontains=search_query)
            )
        
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    """
    Get user statistics for dashboard.
    """
    from invoices.models import Invoice
    from django.db.models import Sum, Q
    from datetime import date, timedelta
    
    user = request.user
    today = date.today()
    last_month = today - timedelta(days=30)
    
    # Get invoice queryset based on user role
    if user.is_admin or user.is_accountant:
        invoice_queryset = Invoice.objects.all()
        client_queryset = Client.objects.all()
    else:
        invoice_queryset = Invoice.objects.filter(created_by=user)
        client_queryset = Client.objects.filter(created_by=user)
    
    # Calculate current month statistics
    current_month_invoices = invoice_queryset.filter(created_at__month=today.month, created_at__year=today.year)
    last_month_invoices = invoice_queryset.filter(created_at__month=last_month.month, created_at__year=last_month.year)
    
    # Invoice counts
    total_invoices = invoice_queryset.count()
    current_month_count = current_month_invoices.count()
    last_month_count = last_month_invoices.count()
    
    # Revenue calculations
    total_revenue = invoice_queryset.filter(status='PAID').aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    current_month_revenue = current_month_invoices.filter(status='PAID').aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    last_month_revenue = last_month_invoices.filter(status='PAID').aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    # Calculate percentages
    revenue_change = 0
    if last_month_revenue > 0:
        revenue_change = ((current_month_revenue - last_month_revenue) / last_month_revenue) * 100
    
    invoice_change = 0
    if last_month_count > 0:
        invoice_change = ((current_month_count - last_month_count) / last_month_count) * 100
    
    # Other statistics
    pending_invoices = invoice_queryset.filter(status='PENDING').count()
    paid_invoices = invoice_queryset.filter(status='PAID').count()
    overdue_invoices = invoice_queryset.filter(
        Q(status='PENDING') & Q(due_date__lt=today)
    ).count()
    
    # Client statistics
    total_clients = client_queryset.count()
    current_month_clients = client_queryset.filter(created_at__month=today.month, created_at__year=today.year).count()
    last_month_clients = client_queryset.filter(created_at__month=last_month.month, created_at__year=last_month.year).count()
    
    client_change = 0
    if last_month_clients > 0:
        client_change = ((current_month_clients - last_month_clients) / last_month_clients) * 100
    
    stats = {
        'totalInvoices': total_invoices,
        'totalRevenue': float(total_revenue),
        'pendingInvoices': pending_invoices,
        'paidInvoices': paid_invoices,
        'overdueInvoices': overdue_invoices,
        'totalClients': total_clients,
        'revenueChange': round(revenue_change, 1),
        'invoiceChange': round(invoice_change, 1),
        'clientChange': round(client_change, 1),
        'currentMonthRevenue': float(current_month_revenue),
        'lastMonthRevenue': float(last_month_revenue),
        'user_role': user.role,
        'user_name': f"{user.first_name} {user.last_name}".strip() or user.username
    }
    
    return Response(stats) 

# ---------------- Platform Admin: Users ----------------
@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_user_list_view(request):
    user = request.user
    if not getattr(user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()
    if request.method == 'GET':
        qs = User.objects.all().order_by('-date_joined')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'role': u.role,
                'date_joined': u.date_joined,
                'is_active': u.is_active,
            } for u in qs
        ]
        return Response(data)

    if request.method == 'POST':
        payload = request.data
        new_user = User.objects.create_user(
            username=payload.get('username'),
            email=payload.get('email'),
            password=payload.get('password') or User.objects.make_random_password(),
        )
        new_user.role = payload.get('role', 'client')
        new_user.save()
        return Response({'id': new_user.id}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_user_detail_view(request, user_id):
    user = request.user
    if not getattr(user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': target.id,
            'username': target.username,
            'email': target.email,
            'role': target.role,
            'date_joined': target.date_joined,
            'is_active': target.is_active,
        })

    if request.method == 'PATCH':
        role = request.data.get('role')
        is_active = request.data.get('is_active')
        if role:
            target.role = role
        if is_active is not None:
            target.is_active = bool(is_active)
        target.save()
        return Response({'detail': 'Updated'})


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_organization_list_view(request):
    if not getattr(request.user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        data = [
            {
                'id': o.id,
                'name': o.name,
                'slug': o.slug,
                'owner_email': o.owner_email,
                'is_active': o.is_active,
                'users': o.users.count(),
            }
            for o in Organization.objects.all().order_by('name')
        ]
        return Response(data)

    if request.method == 'POST':
        payload = request.data
        org = Organization.objects.create(
            name=payload.get('name'),
            slug=payload.get('slug'),
            owner_email=payload.get('owner_email')
        )
        return Response({'id': org.id}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_organization_detail_view(request, org_id):
    if not getattr(request.user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': org.id,
            'name': org.name,
            'slug': org.slug,
            'owner_email': org.owner_email,
            'is_active': org.is_active,
            'users': org.users.count(),
        })

    if request.method == 'PATCH':
        for field in ['name', 'slug', 'owner_email', 'is_active']:
            if field in request.data:
                setattr(org, field, request.data[field])
        org.save()
        return Response({'detail': 'Updated'})


# ---------------- Platform Admin: Users ----------------
@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_user_list_view(request):
    user = request.user
    if not getattr(user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()
    if request.method == 'GET':
        qs = User.objects.all().order_by('-date_joined')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'role': u.role,
                'date_joined': u.date_joined,
                'is_active': u.is_active,
            } for u in qs
        ]
        return Response(data)

    if request.method == 'POST':
        payload = request.data
        new_user = User.objects.create_user(
            username=payload.get('username'),
            email=payload.get('email'),
            password=payload.get('password') or User.objects.make_random_password(),
        )
        new_user.role = payload.get('role', 'client')
        new_user.save()
        return Response({'id': new_user.id}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_user_detail_view(request, user_id):
    user = request.user
    if not getattr(user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': target.id,
            'username': target.username,
            'email': target.email,
            'role': target.role,
            'date_joined': target.date_joined,
            'is_active': target.is_active,
        })

    if request.method == 'PATCH':
        role = request.data.get('role')
        is_active = request.data.get('is_active')
        if role:
            target.role = role
        if is_active is not None:
            target.is_active = bool(is_active)
        target.save()
        return Response({'detail': 'Updated'})


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_organization_list_view(request):
    if not getattr(request.user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        data = [
            {
                'id': o.id,
                'name': o.name,
                'slug': o.slug,
                'owner_email': o.owner_email,
                'is_active': o.is_active,
                'users': o.users.count(),
            }
            for o in Organization.objects.all().order_by('name')
        ]
        return Response(data)

    if request.method == 'POST':
        payload = request.data
        org = Organization.objects.create(
            name=payload.get('name'),
            slug=payload.get('slug'),
            owner_email=payload.get('owner_email')
        )
        return Response({'id': org.id}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_organization_detail_view(request, org_id):
    if not getattr(request.user, 'is_platform_admin', False):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': org.id,
            'name': org.name,
            'slug': org.slug,
            'owner_email': org.owner_email,
            'is_active': org.is_active,
            'users': org.users.count(),
        })

    if request.method == 'PATCH':
        for field in ['name', 'slug', 'owner_email', 'is_active']:
            if field in request.data:
                setattr(org, field, request.data[field])
        org.save()
        return Response({'detail': 'Updated'})

# Session Management Views
class SessionListView(generics.ListAPIView):
    """
    List all active sessions (platform admin only).
    """
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    pagination_class = None  # We'll handle pagination manually
    
    def get_queryset(self):
        # Get query parameters for filtering
        status = self.request.query_params.get('status', 'active')
        user_id = self.request.query_params.get('user_id')
        device_type = self.request.query_params.get('device_type')
        search = self.request.query_params.get('search', '')
        user_role = self.request.query_params.get('user_role', 'all')
        time_range = self.request.query_params.get('time_range', 'all')
        
        queryset = UserSession.objects.select_related('user', 'user__organization')
        
        # Apply filters
        if status and status != 'all':
            queryset = queryset.filter(status=status)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if device_type:
            queryset = queryset.filter(device_type=device_type)
        
        if user_role and user_role != 'all':
            queryset = queryset.filter(user__role=user_role)
        
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(ip_address__icontains=search) |
                Q(location_display__icontains=search)
            )
        
        # Time range filtering
        if time_range != 'all':
            from django.utils import timezone
            now = timezone.now()
            if time_range == '1h':
                queryset = queryset.filter(last_activity__gte=now - timezone.timedelta(hours=1))
            elif time_range == '24h':
                queryset = queryset.filter(last_activity__gte=now - timezone.timedelta(days=1))
            elif time_range == '7d':
                queryset = queryset.filter(last_activity__gte=now - timezone.timedelta(days=7))
            elif time_range == '30d':
                queryset = queryset.filter(last_activity__gte=now - timezone.timedelta(days=30))
        
        # Order by last activity
        return queryset.order_by('-last_activity')
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            
            # Manual pagination
            page = int(request.query_params.get('page', 1))
            page_size = 50
            paginator = Paginator(queryset, page_size)
            
            try:
                sessions = paginator.page(page)
            except EmptyPage:
                sessions = paginator.page(paginator.num_pages)
            
            serializer = UserSessionSerializer(sessions, many=True)
            
            return Response({
                'results': serializer.data,
                'count': paginator.count,
                'total_pages': paginator.num_pages,
                'current_page': page,
                'page_size': page_size
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch sessions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SessionDetailView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific session.
    """
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def get_object(self):
        try:
            session_id = self.kwargs['session_id']
            return get_object_or_404(UserSession, id=session_id)
        except Exception as e:
            raise

    def get(self, request, *args, **kwargs):
        try:
            session = self.get_object()
            serializer = UserSessionSerializer(session)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch session: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SessionTerminationView(generics.UpdateAPIView):
    """
    Terminate one or more sessions.
    """
    serializer_class = SessionTerminationSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def get_object(self):
        try:
            session_ids = self.request.data.get('session_ids')
            if not session_ids:
                raise ValueError("session_ids are required.")
            return UserSession.objects.filter(id__in=session_ids)
        except Exception as e:
            raise

    def update(self, request, *args, **kwargs):
        try:
            queryset = self.get_object()
            reason = request.data.get('reason', 'Admin terminated')
            
            # Terminate sessions
            terminated_count = queryset.update(
                status='terminated',
                is_terminated=True,
                termination_reason=reason
            )
            
            return Response({
                'message': f'Successfully terminated {terminated_count} sessions',
                'terminated_count': terminated_count
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to terminate sessions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SessionBulkActionView(generics.UpdateAPIView):
    """
    Perform bulk actions on sessions.
    """
    serializer_class = SessionBulkActionSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def get_object(self):
        try:
            session_ids = self.request.data.get('session_ids')
            if not session_ids:
                raise ValueError("session_ids are required.")
            return UserSession.objects.filter(id__in=session_ids)
        except Exception as e:
            raise

    def update(self, request, *args, **kwargs):
        try:
            queryset = self.get_object()
            action = request.data.get('action')
            reason = request.data.get('reason', '')
            
            if action == 'terminate':
                updated_count = queryset.update(
                    status='terminated',
                    is_terminated=True,
                    termination_reason=reason or 'Admin terminated'
                )
                message = f'Successfully terminated {updated_count} sessions'
                
            elif action == 'mark_suspicious':
                updated_count = queryset.update(status='suspicious')
                message = f'Successfully marked {updated_count} sessions as suspicious'
                
            elif action == 'mark_expired':
                updated_count = queryset.update(status='expired')
                message = f'Successfully marked {updated_count} sessions as expired'
                
            elif action == 'refresh':
                # Refresh session status based on expiration
                from django.utils import timezone
                now = timezone.now()
                
                expired_count = queryset.filter(expires_at__lt=now).update(status='expired')
                active_count = queryset.filter(expires_at__gte=now).update(status='active')
                
                message = f'Refreshed {expired_count + active_count} sessions ({expired_count} expired, {active_count} active)'
                updated_count = expired_count + active_count
            
            else:
                return Response(
                    {'error': 'Invalid action'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': message,
                'updated_count': updated_count
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to perform bulk action: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SessionMetricsView(APIView):
    """
    Get session metrics and statistics.
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, *args, **kwargs):
        try:
            from django.utils import timezone
            from django.db.models import Count, Q
            
            now = timezone.now()
            
            # Get basic counts
            total_sessions = UserSession.objects.count()
            active_sessions = UserSession.objects.filter(status='active').count()
            expired_sessions = UserSession.objects.filter(status='expired').count()
            terminated_sessions = UserSession.objects.filter(status='terminated').count()
            suspicious_sessions = UserSession.objects.filter(status='suspicious').count()
            
            # Get device type distribution
            device_distribution = UserSession.objects.values('device_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get browser distribution
            browser_distribution = UserSession.objects.values('browser').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get recent activity (last 24 hours)
            last_24h = now - timezone.timedelta(hours=24)
            recent_sessions_24h = UserSession.objects.filter(
                last_activity__gte=last_24h
            ).count()
            
            # Get unique users with active sessions
            unique_active_users = UserSession.objects.filter(
                status='active'
            ).values('user').distinct().count()
            
            # Get sessions by organization
            org_sessions = UserSession.objects.filter(
                status='active'
            ).values('user__organization__name').annotate(
                count=Count('id')
            ).order_by('-count')
            
            return Response({
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
                'expired_sessions': expired_sessions,
                'terminated_sessions': terminated_sessions,
                'suspicious_sessions': suspicious_sessions,
                'recent_sessions_24h': recent_sessions_24h,
                'unique_active_users': unique_active_users,
                'device_distribution': list(device_distribution),
                'browser_distribution': list(browser_distribution),
                'organization_sessions': list(org_sessions),
                'generated_at': now.isoformat()
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch session metrics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RealTimeSessionView(APIView):
    """
    Real-time session monitoring endpoint.
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, *args, **kwargs):
        try:
            from django.utils import timezone
            from django.db.models import Q, Count
            from messaging.models import UserNotification
            
            now = timezone.now()
            
            # Get active sessions with recent activity (last 5 minutes)
            recent_threshold = now - timezone.timedelta(minutes=5)
            active_sessions = UserSession.objects.filter(
                status='active',
                last_activity__gte=recent_threshold
            ).select_related('user').order_by('-last_activity')
            
            # Get suspicious sessions
            suspicious_sessions = UserSession.objects.filter(
                status='suspicious',
                last_activity__gte=recent_threshold
            ).select_related('user').order_by('-last_activity')
            
            # Get recent security alerts
            security_alerts = UserNotification.objects.filter(
                type='security_alert',
                created_at__gte=now - timezone.timedelta(hours=24)
            ).order_by('-created_at')[:10]
            
            # Get session statistics
            total_sessions_today = UserSession.objects.filter(
                created_at__date=now.date()
            ).count()
            
            suspicious_sessions_today = UserSession.objects.filter(
                status='suspicious',
                created_at__date=now.date()
            ).count()
            
            # Get unique IPs today
            unique_ips_today = UserSession.objects.filter(
                created_at__date=now.date()
            ).values('ip_address').distinct().count()
            
            # Format sessions for frontend
            active_sessions_data = []
            for session in active_sessions:
                active_sessions_data.append({
                    'id': session.id,
                    'user': {
                        'id': session.user.id,
                        'username': session.user.username,
                        'email': session.user.email,
                        'role': getattr(session.user, 'role', 'user')
                    },
                    'session_key': session.session_key[:8] + '...',
                    'ip_address': session.ip_address,
                    'device_type': session.device_type,
                    'browser': session.browser,
                    'os': session.os,
                    'location': session.location,
                    'status': session.status,
                    'last_activity': session.last_activity.isoformat(),
                    'duration': str(session.duration),
                    'is_suspicious': session.status == 'suspicious',
                    'termination_reason': session.termination_reason
                })
            
            suspicious_sessions_data = []
            for session in suspicious_sessions:
                suspicious_sessions_data.append({
                    'id': session.id,
                    'user': {
                        'id': session.user.id,
                        'username': session.user.username,
                        'email': session.user.email,
                        'role': getattr(session.user, 'role', 'user')
                    },
                    'session_key': session.session_key[:8] + '...',
                    'ip_address': session.ip_address,
                    'device_type': session.device_type,
                    'browser': session.browser,
                    'os': session.os,
                    'location': session.location,
                    'status': session.status,
                    'last_activity': session.last_activity.isoformat(),
                    'duration': str(session.duration),
                    'is_suspicious': True,
                    'termination_reason': session.termination_reason
                })
            
            # Format security alerts
            security_alerts_data = []
            for alert in security_alerts:
                security_alerts_data.append({
                    'id': alert.id,
                    'title': alert.title,
                    'message': alert.message,
                    'created_at': alert.created_at.isoformat(),
                    'priority': alert.priority,
                    'data': alert.data,
                    'is_read': alert.is_read
                })
            
            return Response({
                'active_sessions': active_sessions_data,
                'suspicious_sessions': suspicious_sessions_data,
                'security_alerts': security_alerts_data,
                'statistics': {
                    'total_active': len(active_sessions_data),
                    'total_suspicious': len(suspicious_sessions_data),
                    'total_sessions_today': total_sessions_today,
                    'suspicious_sessions_today': suspicious_sessions_today,
                    'unique_ips_today': unique_ips_today,
                    'security_alerts_count': len(security_alerts_data)
                },
                'last_updated': now.isoformat(),
                'status': 'success'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch real-time session data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SessionTerminationView(APIView):
    """
    Terminate suspicious or problematic sessions.
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def post(self, request, session_id):
        try:
            from django.utils import timezone
            
            session = UserSession.objects.get(id=session_id)
            
            # Terminate the session
            session.status = 'terminated'
            session.termination_reason = request.data.get('reason', 'Terminated by admin')
            session.terminated_at = timezone.now()
            session.save()
            
            # Create notification for the user whose session was terminated
            from messaging.models import UserNotification
            UserNotification.objects.create(
                user=session.user,
                type='session_terminated',
                title='Session Terminated',
                message=f'Your session was terminated by an administrator. Reason: {session.termination_reason}',
                data={
                    'session_id': session.id,
                    'terminated_by': request.user.username,
                    'reason': session.termination_reason,
                    'timestamp': timezone.now().isoformat()
                },
                priority='high'
            )
            
            return Response({
                'message': 'Session terminated successfully',
                'session_id': session.id,
                'user': session.user.username
            })
            
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to terminate session: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SecurityAlertsView(APIView):
    """
    Get security alerts and suspicious activity.
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request):
        try:
            from django.utils import timezone
            from messaging.models import UserNotification
            from django.db.models import Q
            
            # Get query parameters
            hours = int(request.query_params.get('hours', 24))
            alert_type = request.query_params.get('type', 'all')
            
            # Calculate time threshold
            time_threshold = timezone.now() - timezone.timedelta(hours=hours)
            
            # Build query
            query = Q(created_at__gte=time_threshold)
            if alert_type != 'all':
                query &= Q(type=alert_type)
            
            # Get alerts
            alerts = UserNotification.objects.filter(query).order_by('-created_at')
            
            # Format alerts
            alerts_data = []
            for alert in alerts:
                alerts_data.append({
                    'id': alert.id,
                    'type': alert.type,
                    'title': alert.title,
                    'message': alert.message,
                    'created_at': alert.created_at.isoformat(),
                    'priority': alert.priority,
                    'is_read': alert.is_read,
                    'data': alert.data,
                    'user': {
                        'id': alert.user.id,
                        'username': alert.user.username,
                        'email': alert.user.email
                    }
                })
            
            return Response({
                'alerts': alerts_data,
                'total_count': len(alerts_data),
                'time_range_hours': hours,
                'last_updated': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch security alerts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )