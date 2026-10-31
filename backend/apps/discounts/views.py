from rest_framework import viewsets, permissions
from .models import Discount
from .serializers import DiscountSerializer
from apps.identity.models import CustomUser

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_authenticated:
            return getattr(request.user, 'role', '') == CustomUser.Role.ADMIN or request.user.is_superuser
        return False

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().select_related('specific_product').order_by('-created_at')
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
