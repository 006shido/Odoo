from rest_framework import viewsets, permissions, exceptions
from .models import Discount
from .serializers import DiscountSerializer
from apps.identity.models import CustomUser

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == CustomUser.Role.ADMIN

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().select_related('specific_product').order_by('-created_at')
    serializer_class = DiscountSerializer
    permission_classes = [IsAdminOrReadOnly]

