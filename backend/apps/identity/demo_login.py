"""Local-only role entry points for hackathon demonstrations."""
from django.conf import settings
from django.contrib.auth import login
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import CustomUser
from .serializers import UserSerializer

DEMO_EMAILS = {role: f'demo-login-{role}@example.invalid' for role in ('admin', 'staff', 'customer')}


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def demo_login_view(request):
    local = request.get_host().split(':')[0] in ('localhost', '127.0.0.1')
    enabled = settings.DEBUG and settings.ENABLE_LOCAL_DEMO_LOGIN and local and request.META.get('REMOTE_ADDR') in ('127.0.0.1', '::1')
    if request.method == 'GET':
        return Response({'enabled': bool(enabled)})
    if not enabled:
        return Response({'error': 'Demo login is unavailable.'}, status=404)
    SessionAuthentication().enforce_csrf(request)
    role = request.data.get('role')
    email = DEMO_EMAILS.get(role) if isinstance(role, str) else None
    user = CustomUser.objects.filter(email=email, role=role, is_active=True).first() if email else None
    if not user:
        return Response({'error': 'Demo account is not configured.'}, status=400)
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    return Response({'user': UserSerializer(user).data})
