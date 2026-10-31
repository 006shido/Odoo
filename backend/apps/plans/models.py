import uuid
from decimal import Decimal
from django.db import models
from apps.catalogue.models import Product, ProductVariant

class SubscriptionPlan(models.Model):
    class BillingFrequency(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    billing_frequency = models.CharField(
        max_length=20, choices=BillingFrequency.choices, default=BillingFrequency.MONTHLY
    )
    price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    minimum_quantity = models.PositiveIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # Lifecycle rules decided by admin plan by plan:
    auto_close_on_expiry = models.BooleanField(
        default=True, help_text="Should close on its own when the plan period ends."
    )
    can_close_early = models.BooleanField(
        default=True, help_text="Can be terminated early by customer or staff."
    )
    can_pause = models.BooleanField(
        default=True, help_text="Can be temporarily paused and resumed."
    )
    can_renew = models.BooleanField(
        default=True, help_text="Can be renewed at expiry."
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.billing_frequency}) - {self.price}"

class PlanItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='plan_items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f"{self.plan.name} -> {self.product.name} x{self.quantity}"
