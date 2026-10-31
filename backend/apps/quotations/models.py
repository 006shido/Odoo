import uuid
from decimal import Decimal
from django.db import models
from apps.identity.models import Customer
from apps.plans.models import SubscriptionPlan
from apps.catalogue.models import Product, ProductVariant

class Quotation(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        CONVERTED = 'converted', 'Converted'
        EXPIRED = 'expired', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quotation_number = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='quotations')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    valid_until = models.DateField(null=True, blank=True)
    payment_terms = models.CharField(max_length=100, default="Net 15")

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quotation_number} - {self.customer.name} ({self.status})"

    def calculate_totals(self):
        calculated_subtotal = Decimal('0.00')
        for item in self.line_items.all():
            calculated_subtotal += item.total_price

        self.subtotal = calculated_subtotal
        effective_subtotal = max(Decimal('0.00'), self.subtotal - self.discount_amount)
        self.tax_amount = (effective_subtotal * (self.tax_rate / Decimal('100.00'))).quantize(Decimal('0.01'))
        self.total_amount = effective_subtotal + self.tax_amount
        self.save()

class QuotationLineItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='line_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    @property
    def total_price(self):
        return (self.unit_price * Decimal(self.quantity)).quantize(Decimal('0.01'))

    def __str__(self):
        return f"{self.quotation.quotation_number} -> {self.product.name} x{self.quantity}"
