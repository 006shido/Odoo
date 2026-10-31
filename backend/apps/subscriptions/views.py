from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Subscription, SubscriptionEvent
from .serializers import SubscriptionSerializer
from apps.identity.models import CustomUser

class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all().select_related('customer', 'plan').prefetch_related('line_items__product', 'events').order_by('-created_at')
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Subscription.objects.none()
        if user.role == CustomUser.Role.CUSTOMER:
            return Subscription.objects.filter(customer__user=user)
        return Subscription.objects.all().select_related('customer', 'plan').prefetch_related('line_items__product', 'events').order_by('-created_at')

    def _record_event(self, subscription, from_status, to_status, reason=''):
        actor = self.request.user.email if self.request.user.is_authenticated else 'System'
        SubscriptionEvent.objects.create(
            subscription=subscription,
            from_status=from_status,
            to_status=to_status,
            actor=actor,
            reason=reason,
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        sub = self.get_object()
        old_status = sub.status
        sub.status = Subscription.Status.CONFIRMED
        sub.save(update_fields=['status'])
        self._record_event(sub, old_status, sub.status, 'Confirmed subscription terms')
        return Response({'message': f'Subscription {sub.subscription_number} confirmed.'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        sub = self.get_object()
        old_status = sub.status
        sub.status = Subscription.Status.ACTIVE
        sub.save(update_fields=['status'])
        self._record_event(sub, old_status, sub.status, 'Activated recurring billing cycle')
        return Response({'message': f'Subscription {sub.subscription_number} is now active.'})

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        sub = self.get_object()
        if sub.plan and not sub.plan.can_pause:
            return Response({'error': f'Plan {sub.plan.name} does not allow pausing.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Customer requested temporary pause')
        old_status = sub.status
        sub.status = Subscription.Status.PAUSED
        sub.paused_at = timezone.now()
        sub.pause_reason = reason
        sub.save(update_fields=['status', 'paused_at', 'pause_reason'])
        self._record_event(sub, old_status, sub.status, reason)
        return Response({'message': f'Subscription {sub.subscription_number} paused.'})

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        sub = self.get_object()
        old_status = sub.status
        sub.status = Subscription.Status.ACTIVE
        sub.next_billing_date = timezone.now().date()
        sub.save(update_fields=['status', 'next_billing_date'])
        self._record_event(sub, old_status, sub.status, 'Resumed subscription billing')
        return Response({'message': f'Subscription {sub.subscription_number} resumed. Next billing date: {sub.next_billing_date}.'})

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        sub = self.get_object()
        if sub.plan and not sub.plan.can_renew:
            return Response({'error': f'Plan {sub.plan.name} does not allow renewal.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extend expiry date by 1 year or 1 month
        days = 365 if sub.billing_frequency == 'yearly' else 30
        current_expiry = sub.expiry_date or timezone.now().date()
        sub.expiry_date = current_expiry + timedelta(days=days)
        sub.status = Subscription.Status.ACTIVE
        sub.save(update_fields=['expiry_date', 'status'])
        self._record_event(sub, 'renew', sub.status, f'Renewed until {sub.expiry_date}')
        return Response({'message': f'Subscription {sub.subscription_number} renewed until {sub.expiry_date}.'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        sub = self.get_object()
        if sub.plan and not sub.plan.can_close_early:
            return Response({'error': f'Plan {sub.plan.name} does not allow closing early.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Cancelled early by user')
        old_status = sub.status
        sub.status = Subscription.Status.CLOSED
        sub.closed_at = timezone.now()
        sub.close_reason = reason
        sub.save(update_fields=['status', 'closed_at', 'close_reason'])
        self._record_event(sub, old_status, sub.status, reason)
        return Response({'message': f'Subscription {sub.subscription_number} closed.'})
