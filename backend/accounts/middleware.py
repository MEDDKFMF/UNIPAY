"""
Session tracking middleware for monitoring user activity.
"""

import re
from django.utils import timezone
from django.contrib.sessions.models import Session
from django.contrib.auth.models import AnonymousUser
from user_agents import parse
from .models import UserSession


class SessionTrackingMiddleware:
    """
    Middleware to track user sessions and activity.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Process request
        response = self.get_response(request)
        
        # Track session after response is processed
        self.track_session(request)
        
        return response
    
    def track_session(self, request):
        """Track user session and activity."""
        try:
            # Skip for anonymous users
            if isinstance(request.user, AnonymousUser):
                return
            
            # Skip for certain paths (static files, media, etc.)
            if self.should_skip_tracking(request.path):
                return
            
            # Get session key - handle both Django sessions and JWT API calls
            session_key = request.session.session_key
            if not session_key:
                # For API calls with JWT tokens, create a session key based on user and IP
                if hasattr(request, 'user') and request.user.is_authenticated:
                    import hashlib
                    ip_address = self.get_client_ip(request)
                    # Create a stable session key for this user+IP combination
                    session_key = hashlib.md5(f"{request.user.id}_{ip_address}".encode()).hexdigest()
                else:
                    return
            
            # Parse user agent
            user_agent_string = request.META.get('HTTP_USER_AGENT', '')
            user_agent = parse(user_agent_string)
            
            # Get device type
            device_type = 'desktop'
            if user_agent.is_mobile:
                device_type = 'mobile'
            elif user_agent.is_tablet:
                device_type = 'tablet'
            
            # Get IP address
            ip_address = self.get_client_ip(request)
            
            # Get location (placeholder - would integrate with IP geolocation service)
            location = self.get_location_from_ip(ip_address)
            
            # Update or create session record
            session_record, created = UserSession.objects.get_or_create(
                session_key=session_key,
                defaults={
                    'user': request.user,
                    'ip_address': ip_address,
                    'user_agent': user_agent_string,
                    'device_type': device_type,
                    'browser': user_agent.browser.family,
                    'os': user_agent.os.family,
                    'location': location,
                    'status': 'active',
                    'last_activity': timezone.now(),
                    'expires_at': self.get_session_expiry(request)
                }
            )
            
            if not created:
                # Update existing session
                session_record.last_activity = timezone.now()

                # If the existing session was terminated/expired/suspicious, reactivate on valid authenticated activity
                if session_record.status in ['terminated', 'expired']:
                    session_record.status = 'active'
                    session_record.termination_reason = None
                    try:
                        # Clear terminated_at if present
                        session_record.terminated_at = None
                    except Exception:
                        pass

                # Check for suspicious activity
                suspicious = self.check_suspicious_activity(session_record, ip_address, user_agent_string)
                if suspicious:
                    session_record.status = 'suspicious'
                    session_record.termination_reason = suspicious
                    
                    # Create admin alert for suspicious activity
                    self.create_security_alert(session_record, suspicious, ip_address, user_agent_string)
                
                session_record.ip_address = ip_address
                session_record.user_agent = user_agent_string
                # Persist updates
                session_record.save(update_fields=['last_activity', 'ip_address', 'user_agent', 'status', 'termination_reason'])
                
        except Exception as e:
            # Log error but don't break the request
            print(f"Session tracking error: {e}")
    
    def should_skip_tracking(self, path):
        """Check if path should be skipped for tracking."""
        skip_patterns = [
            r'^/static/',
            r'^/media/',
            r'^/admin/jsi18n/',
            r'^/favicon\.ico$',
            r'^/robots\.txt$',
        ]
        
        for pattern in skip_patterns:
            if re.match(pattern, path):
                return True
        return False
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def get_location_from_ip(self, ip_address):
        """Get location from IP address (placeholder)."""
        # In production, integrate with IP geolocation service like:
        # - MaxMind GeoIP2
        # - IP-API
        # - ipinfo.io
        
        # For now, return a basic location based on IP
        if ip_address == "127.0.0.1" or ip_address.startswith("192.168.") or ip_address.startswith("10."):
            return "Local Network"
        elif ip_address.startswith("172."):
            return "Private Network"
        else:
            return "External Network"
    
    def get_session_expiry(self, request):
        """Get session expiry time."""
        try:
            # Get session expiry from Django settings
            from django.conf import settings
            session_timeout = getattr(settings, 'SESSION_COOKIE_AGE', 1209600)  # 2 weeks default
            return timezone.now() + timezone.timedelta(seconds=session_timeout)
        except:
            return None
    
    def check_suspicious_activity(self, session_record, current_ip, current_user_agent):
        """Check for suspicious activity patterns."""
        try:
            # Check for IP address change
            if session_record.ip_address and session_record.ip_address != current_ip:
                # Check if it's a geographic anomaly
                if self.check_geographic_anomaly(session_record, current_ip):
                    return f"Unusual geographic login: IP changed from {session_record.ip_address} to {current_ip}"
                else:
                    return f"IP address changed from {session_record.ip_address} to {current_ip}"
            
            # Check for user agent change
            if session_record.user_agent and session_record.user_agent != current_user_agent:
                return f"User agent changed from {session_record.user_agent} to {current_user_agent}"
            
            # Check for rapid requests (more than 100 requests in 1 minute)
            from django.utils import timezone
            from django.db.models import Count
            one_minute_ago = timezone.now() - timezone.timedelta(minutes=1)
            
            recent_requests = UserSession.objects.filter(
                user=session_record.user,
                last_activity__gte=one_minute_ago
            ).count()
            
            if recent_requests > 100:
                return f"High frequency requests detected: {recent_requests} requests in 1 minute"
            
            # Check for brute force attempts
            if self.check_brute_force_attempts(current_ip, session_record.user.id):
                return f"Potential brute force attack detected from IP {current_ip}"
            
            # Check for unusual login times (outside business hours)
            current_hour = timezone.now().hour
            if current_hour < 6 or current_hour > 22:  # Outside 6 AM to 10 PM
                return f"Unusual login time: {current_hour}:00"
            
            # Check for multiple concurrent sessions from different IPs
            concurrent_sessions = UserSession.objects.filter(
                user=session_record.user,
                status='active',
                last_activity__gte=timezone.now() - timezone.timedelta(minutes=30)
            ).exclude(ip_address=current_ip).count()
            
            if concurrent_sessions > 2:  # More than 2 concurrent sessions from different IPs
                return f"Multiple concurrent sessions detected: {concurrent_sessions + 1} active sessions"
            
            return None
            
        except Exception as e:
            print(f"Suspicious activity check error: {e}")
            return None
    
    def create_security_alert(self, session_record, suspicious_reason, ip_address, user_agent_string):
        """Create a security alert for admin notification."""
        try:
            from messaging.models import UserNotification
            from django.contrib.auth.models import User
            
            # Get all platform admins
            admin_users = User.objects.filter(role='platform_admin')
            
            # Create alert message
            alert_message = f"Suspicious activity detected for user {session_record.user.username}: {suspicious_reason}"
            
            # Create notifications for all admins
            for admin in admin_users:
                UserNotification.objects.create(
                    user=admin,
                    type='security_alert',
                    title='Security Alert',
                    message=alert_message,
                    data={
                        'session_id': session_record.id,
                        'user_id': session_record.user.id,
                        'username': session_record.user.username,
                        'ip_address': ip_address,
                        'user_agent': user_agent_string,
                        'reason': suspicious_reason,
                        'timestamp': timezone.now().isoformat(),
                        'location': session_record.location
                    },
                    priority='high'
                )
                
        except Exception as e:
            print(f"Error creating security alert: {e}")
    
    def check_brute_force_attempts(self, ip_address, user_id=None):
        """Check for brute force login attempts."""
        try:
            from django.utils import timezone
            from django.db.models import Count
            
            # Check for multiple failed login attempts from same IP in last 15 minutes
            fifteen_minutes_ago = timezone.now() - timezone.timedelta(minutes=15)
            
            if user_id:
                # Check specific user
                failed_attempts = UserSession.objects.filter(
                    user_id=user_id,
                    status='failed',
                    last_activity__gte=fifteen_minutes_ago
                ).count()
            else:
                # Check IP address
                failed_attempts = UserSession.objects.filter(
                    ip_address=ip_address,
                    status='failed',
                    last_activity__gte=fifteen_minutes_ago
                ).count()
            
            return failed_attempts > 5  # More than 5 failed attempts in 15 minutes
            
        except Exception as e:
            print(f"Error checking brute force attempts: {e}")
            return False
    
    def check_geographic_anomaly(self, session_record, current_ip):
        """Check for unusual geographic login patterns."""
        try:
            # This is a placeholder - in production, you'd integrate with IP geolocation
            # For now, we'll just check if IP changed significantly
            if session_record.ip_address and session_record.ip_address != current_ip:
                # Check if it's a different IP range (basic check)
                old_ip_parts = session_record.ip_address.split('.')
                new_ip_parts = current_ip.split('.')
                
                # If first two octets are different, it might be a different location
                if len(old_ip_parts) >= 2 and len(new_ip_parts) >= 2:
                    if old_ip_parts[0] != new_ip_parts[0] or old_ip_parts[1] != new_ip_parts[1]:
                        return True
            
            return False
            
        except Exception as e:
            print(f"Error checking geographic anomaly: {e}")
            return False


class SessionCleanupMiddleware:
    """
    Middleware to clean up expired sessions.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Clean up expired sessions (only occasionally to avoid performance impact)
        if self.should_cleanup():
            self.cleanup_expired_sessions()
        
        response = self.get_response(request)
        return response
    
    def should_cleanup(self):
        """Check if cleanup should run (1 in 100 requests)."""
        import random
        return random.randint(1, 100) == 1
    
    def cleanup_expired_sessions(self):
        """Clean up expired sessions."""
        try:
            from django.utils import timezone
            now = timezone.now()
            
            # Mark expired sessions
            expired_count = UserSession.objects.filter(
                expires_at__lt=now,
                status='active'
            ).update(status='expired')
            
            # Clean up very old terminated sessions (older than 30 days)
            cutoff_date = now - timezone.timedelta(days=30)
            old_terminated = UserSession.objects.filter(
                status='terminated',
                last_activity__lt=cutoff_date
            ).delete()
            
        except Exception as e:
            print(f"Session cleanup error: {e}")
