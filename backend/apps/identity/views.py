from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import CustomUser, Customer
from .serializers import UserSerializer, CustomerSerializer, RegisterSerializer, LoginSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_view(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)
        return Response({
            'message': 'Account registered successfully.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']
        user = authenticate(request, email=email, password=password)
        if user is not None:
            if not user.is_active:
                return Response({'error': 'Account is deactivated.'}, status=status.HTTP_403_FORBIDDEN)
            login(request, user)
            return Response({
                'message': 'Logged in successfully.',
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out successfully.'})

@api_view(['GET'])
def me_view(request):
    if not request.user.is_authenticated:
        return Response({'authenticated': False, 'user': None})
    customer_id = None
    if hasattr(request.user, 'customer_profile') and request.user.customer_profile:
        customer_id = str(request.user.customer_profile.id)
    return Response({
        'authenticated': True,
        'user': UserSerializer(request.user).data,
        'customer_id': customer_id,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    # Simulated email reset link per requirements
    return Response({
        'message': f'If an account exists for {email}, a password reset link has been dispatched.',
    })

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        if user.role == CustomUser.Role.CUSTOMER:
            return Customer.objects.filter(user=user)
        return Customer.objects.all().order_by('-created_at')

