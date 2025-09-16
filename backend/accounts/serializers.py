"""
Serializers for user authentication and client management.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User, Client, Organization, UserSession


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user role and additional info.
    """
    
    def validate(self, attrs):
        # Allow login with either username or email
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        if username_or_email and password:
            # Try to authenticate with username first
            user = authenticate(username=username_or_email, password=password)
            
            # If that fails, try with email
            if not user:
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    user = None
            
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            self.user = user
            data = super().validate(attrs)
            
            # Add custom claims
            data['user_id'] = self.user.id
            data['username'] = self.user.username
            data['email'] = self.user.email
            data['role'] = self.user.role
            data['first_name'] = self.user.first_name
            data['last_name'] = self.user.last_name
            data['company_name'] = self.user.company_name
            
            return data
        else:
            raise serializers.ValidationError('Must include username/email and password.')


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'company_name',
            'address', 'role'
        ]
        extra_kwargs = {
            'role': {'read_only': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile.
    """
    avatar_url = serializers.SerializerMethodField()
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'company_name', 'address', 'avatar', 'avatar_url',
            'website', 'bio', 'job_title', 'department', 'employee_id',
            'date_of_birth', 'nationality', 'emergency_contact', 'emergency_phone',
            'role', 'is_verified', 'date_joined', 'created_at', 'updated_at',
            'organization', 'organization_name'
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at']
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            return self.context['request'].build_absolute_uri(obj.avatar.url)
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'company_name', 'address',
            'website', 'bio', 'job_title', 'department', 'employee_id',
            'date_of_birth', 'nationality', 'emergency_contact', 'emergency_phone',
            'organization'
        ]
    
    def validate_date_of_birth(self, value):
        """Handle empty date strings"""
        if value == '' or value is None:
            return None
        return value


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for client management.
    """
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'email', 'phone', 'company_name', 'address',
            'tax_id', 'notes', 'is_active', 'created_by', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ClientCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating clients.
    """
    class Meta:
        model = Client
        fields = [
            'name', 'email', 'phone', 'company_name', 'address',
            'tax_id', 'notes', 'is_active'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        if username_or_email and password:
            # Try to authenticate with username first
            user = authenticate(username=username_or_email, password=password)
            
            # If that fails, try with email
            if not user:
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    user = None
            
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username/email and password.')
        
        return attrs


class UserSessionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    organization_name = serializers.CharField(source='user.organization.name', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    location_display = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'user_username', 'user_email', 'user_role', 'organization_name',
            'session_key', 'ip_address', 'user_agent', 'device_type', 'browser', 'os',
            'location', 'location_display', 'status', 'last_activity', 'created_at',
            'expires_at', 'is_terminated', 'termination_reason', 'duration_formatted'
        ]
        read_only_fields = ['id', 'session_key', 'created_at', 'last_activity']
    
    def get_duration_formatted(self, obj):
        duration = obj.duration
        if duration:
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "N/A"
    
    def get_location_display(self, obj):
        if obj.location:
            return obj.location
        return "Unknown"


class SessionTerminationSerializer(serializers.Serializer):
    session_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of session IDs to terminate"
    )
    reason = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Reason for terminating sessions"
    )


class SessionBulkActionSerializer(serializers.Serializer):
    session_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of session IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=[
            ('terminate', 'Terminate'),
            ('mark_suspicious', 'Mark as Suspicious'),
            ('mark_expired', 'Mark as Expired'),
            ('refresh', 'Refresh Status')
        ],
        help_text="Action to perform on selected sessions"
    )
    reason = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Reason for the action"
    )

