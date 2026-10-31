import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.catalogue.models import Product

class Discount(models.Model):
    class DiscountType(models.TextChoices):
        FIXED = 'fixed', 'Fixed Amount'
        PERCENTAGE = 'percentage', 'Percentage'

    class Scope(models.TextChoices):
        PRODUCT = 'product', 'Specific Product'
        SUBSCRIPTION = 'subscription', 'Whole Subscription'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    value = models.DecimalField(max_digits=12, decimal_places=2, help_text="e.g. 10.00 for 10% or 500.00 for fixed ₹500")

    scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.SUBSCRIPTION)
    specific_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='discounts')

    minimum_purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    minimum_quantity = models.PositiveIntegerField(default=1)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    usage_limit = models.PositiveIntegerField(default=100, help_text="Total number of times this discount can be applied")
    times_used = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.value}{'%' if self.discount_type == self.DiscountType.PERCENTAGE else ' ₹'}"

    def is_eligible(self, subtotal: Decimal, quantity: int = 1, product_id=None) -> bool:
        today = timezone.now().date()
        if not self.is_active:
            return False
        if self.times_used >= self.usage_limit:
            return False
        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        if subtotal < self.minimum_purchase_amount:
            return False
        if quantity < self.minimum_quantity:
            return False
        if self.scope == self.Scope.PRODUCT and self.specific_product_id:
            if str(self.specific_product_id) != str(product_id):
                return False
        return True

    def calculate_discount_amount(self, subtotal: Decimal) -> Decimal:
        if self.discount_type == self.DiscountType.PERCENTAGE:
            discount = (subtotal * (self.value / Decimal('100.00'))).quantize(Decimal('0.01'))
            return min(subtotal, discount)
        return min(subtotal, self.value)
