import uuid
from decimal import Decimal
from django.db import models
from apps.identity.models import Customer
from apps.plans.models import SubscriptionPlan
from apps.catalogue.models import Product, ProductVariant

class Subscription(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        QUOTATION = 'quotation', 'Quotation'
        CONFIRMED = 'confirmed', 'Confirmed'
        ACTIVE = 'active', 'Active'
        PAUSED = 'paused', 'Paused'
        CLOSED = 'closed', 'Closed'
        EXPIRED = 'expired', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription_number = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    source_quotation = models.ForeignKey(
        'quotations.Quotation', on_delete=models.SET_NULL, null=True, blank=True, related_name='converted_subscriptions'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    start_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    next_billing_date = models.DateField()
    billing_frequency = models.CharField(max_length=20, default='monthly')
    payment_terms = models.CharField(max_length=100, default='Net 15')

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    paused_at = models.DateTimeField(null=True, blank=True)
    pause_reason = models.TextField(blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    close_reason = models.TextField(blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.subscription_number} - {self.customer.name} ({self.status})"

class SubscriptionLineItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='line_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))

    @property
    def total_price(self):
        return (self.unit_price * Decimal(self.quantity)).quantize(Decimal('0.01'))

class SubscriptionEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='events')
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    actor = models.CharField(max_length=150, blank=True)
    reason = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subscription.subscription_number}: {self.from_status} -> {self.to_status} at {self.timestamp}"
