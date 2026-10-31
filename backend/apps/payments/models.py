import uuid
from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from apps.identity.models import Customer
from apps.billing.models import Invoice

class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        UPI = 'upi', 'UPI'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER)
    transaction_reference = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.amount <= Decimal('0.00'):
            raise ValidationError('Payment amount must be greater than zero.')
        if self.invoice and self.amount > self.invoice.balance_due:
            raise ValidationError(
                f'Payment amount (₹{self.amount}) exceeds outstanding invoice balance (₹{self.invoice.balance_due}).'
            )

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new and self.invoice:
            self.invoice.paid_amount += self.amount
            self.invoice.recalculate_balances()

    def __str__(self):
        return f"{self.payment_number} - ₹{self.amount} ({self.payment_method})"

