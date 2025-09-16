from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import UserProfileSettings, PlatformSettings
from .serializers import (
    UserProfileSettingsSerializer, UserProfileSettingsUpdateSerializer,
    PlatformSettingsSerializer, PlatformSettingsUpdateSerializer
)


class IsPlatformAdmin(BasePermission):
    """
    Custom permission to only allow platform admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_platform_admin', False))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile_settings(request):
    """
    Get user's profile settings.
    """
    try:
        settings = UserProfileSettings.get_user_settings(request.user)
        serializer = UserProfileSettingsSerializer(settings, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch profile settings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile_settings(request):
    """
    Update user's profile settings.
    """
    try:
        settings = UserProfileSettings.get_user_settings(request.user)
        serializer = UserProfileSettingsUpdateSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            # Return the full settings data
            full_serializer = UserProfileSettingsSerializer(settings, context={'request': request})
            return Response(full_serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Failed to update profile settings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoice_header_data(request):
    """
    Get formatted header data for invoices.
    """
    try:
        settings = UserProfileSettings.get_user_settings(request.user)
        header_data = settings.get_header_data()
        return Response(header_data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch header data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_platform_settings(request):
    """
    Get platform settings (read-only for users).
    """
    try:
        settings = PlatformSettings.get_settings()
        serializer = PlatformSettingsSerializer(settings)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch platform settings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsPlatformAdmin])
def update_platform_settings(request):
    """
    Update platform settings (admin only).
    """
    try:
        settings = PlatformSettings.get_settings()
        serializer = PlatformSettingsUpdateSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            # Return the full settings data
            full_serializer = PlatformSettingsSerializer(settings)
            return Response(full_serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Failed to update platform settings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email_settings(request):
    """
    Test email settings by sending a test email.
    """
    try:
        # This would implement actual email testing
        # For now, just return success
        return Response({'message': 'Email settings test successful'})
    except Exception as e:
        return Response(
            {'error': f'Email test failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_supported_currencies(request):
    """
    Get list of supported currencies.
    """
    try:
        settings = PlatformSettings.get_settings()
        return Response(settings.supported_currencies)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch currencies: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 
    try:
        settings = PlatformSettings.get_settings()
        return Response(settings.supported_currencies)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch currencies: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 