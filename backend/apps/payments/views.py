from django.utils import timezone
from rest_framework import viewsets
from .models import Payment
from .serializers import PaymentSerializer
from apps.identity.models import CustomUser

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related('customer', 'invoice').order_by('-created_at')
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        if user.role == CustomUser.Role.CUSTOMER:
            return Payment.objects.filter(customer__user=user)
        return Payment.objects.all().select_related('customer', 'invoice').order_by('-created_at')

    def perform_create(self, serializer):
        count = Payment.objects.count() + 1
        pay_num = f"PAY-{timezone.now().year}-{count:05d}"
        serializer.save(payment_number=pay_num)

