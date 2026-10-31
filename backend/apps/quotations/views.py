from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Quotation, QuotationLineItem
from .serializers import QuotationSerializer, QuotationLineItemSerializer
from apps.subscriptions.models import Subscription, SubscriptionLineItem, SubscriptionEvent
from apps.identity.models import CustomUser

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().select_related('customer', 'plan').prefetch_related('line_items__product').order_by('-created_at')
    serializer_class = QuotationSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Quotation.objects.none()
        if user.role == CustomUser.Role.CUSTOMER:
            return Quotation.objects.filter(customer__user=user)
        return Quotation.objects.all().select_related('customer', 'plan').prefetch_related('line_items__product').order_by('-created_at')

    def perform_create(self, serializer):
        count = Quotation.objects.count() + 1
        quot_num = f"QT-{timezone.now().year}-{count:04d}"
        quotation = serializer.save(quotation_number=quot_num)

        # If created with a plan, populate default items
        if quotation.plan:
            for item in quotation.plan.items.all():
                QuotationLineItem.objects.create(
                    quotation=quotation,
                    product=item.product,
                    variant=item.variant,
                    quantity=item.quantity,
                    unit_price=item.unit_price or item.product.sales_price,
                )
            quotation.calculate_totals()

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.Status.SENT
        quotation.save(update_fields=['status'])
        return Response({'message': f'Quotation {quotation.quotation_number} sent to customer.'})

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.Status.ACCEPTED
        quotation.save(update_fields=['status'])
        return Response({'message': f'Quotation {quotation.quotation_number} accepted.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.Status.REJECTED
        quotation.save(update_fields=['status'])
        return Response({'message': f'Quotation {quotation.quotation_number} marked as rejected.'})

    @action(detail=True, methods=['post'])
    def convert_to_subscription(self, request, pk=None):
        quotation = self.get_object()

        # Idempotency check: prevent duplicate conversion
        if quotation.status == Quotation.Status.CONVERTED:
            return Response(
                {'error': f'Quotation {quotation.quotation_number} has already been converted to a subscription.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            sub_count = Subscription.objects.count() + 1
            sub_number = f"SUB-{timezone.now().year}-{sub_count:04d}"

            start_date = timezone.now().date()
            freq = quotation.plan.billing_frequency if quotation.plan else 'monthly'

            # 1-year contract default expiry
            expiry_date = start_date + timedelta(days=365)
            next_billing = start_date

            subscription = Subscription.objects.create(
                subscription_number=sub_number,
                customer=quotation.customer,
                plan=quotation.plan,
                source_quotation=quotation,
                status=Subscription.Status.ACTIVE,
                start_date=start_date,
                expiry_date=expiry_date,
                next_billing_date=next_billing,
                billing_frequency=freq,
                payment_terms=quotation.payment_terms,
                subtotal=quotation.subtotal,
                tax_rate=quotation.tax_rate,
                tax_amount=quotation.tax_amount,
                total_amount=quotation.total_amount,
                notes=f"Converted from {quotation.quotation_number}",
            )

            # Copy line items
            for item in quotation.line_items.all():
                SubscriptionLineItem.objects.create(
                    subscription=subscription,
                    product=item.product,
                    variant=item.variant,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    tax_rate=quotation.tax_rate,
                )

            # Record event
            SubscriptionEvent.objects.create(
                subscription=subscription,
                from_status='quotation',
                to_status='active',
                actor=request.user.email if request.user.is_authenticated else 'Sales Rep',
                reason=f"Converted from accepted quotation {quotation.quotation_number}",
            )

            quotation.status = Quotation.Status.CONVERTED
            quotation.save(update_fields=['status'])

        return Response({
            'message': f'Quotation converted successfully to subscription {subscription.subscription_number}.',
            'subscription_id': str(subscription.id),
            'subscription_number': subscription.subscription_number,
        })
