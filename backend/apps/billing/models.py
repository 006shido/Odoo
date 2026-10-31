import uuid
from decimal import Decimal
from django.db import models
from apps.identity.models import Customer
from apps.subscriptions.models import Subscription
from apps.discounts.models import Discount

class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        CONFIRMED = 'confirmed', 'Confirmed'
        PAID = 'paid', 'Paid'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    applied_discount = models.ForeignKey(Discount, on_delete=models.SET_NULL, null=True, blank=True)

    issue_date = models.DateField()
    due_date = models.DateField()
    billing_period_start = models.DateField(null=True, blank=True)
    billing_period_end = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['subscription', 'billing_period_start', 'billing_period_end'],
                name='unique_subscription_billing_period',
                condition=models.Q(subscription__isnull=False, billing_period_start__isnull=False)
            )
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name} (₹{self.total_amount})"

    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status != self.Status.PAID and self.due_date < timezone.now().date()

    def recalculate_balances(self):
        self.balance_due = max(Decimal('0.00'), self.total_amount - self.paid_amount)
        if self.balance_due == Decimal('0.00') and self.paid_amount > Decimal('0.00'):
            self.status = self.Status.PAID
        elif self.status == self.Status.PAID and self.balance_due > Decimal('0.00'):
            self.status = self.Status.CONFIRMED
        self.save()

class InvoiceLineItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='line_items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.invoice.invoice_number} -> {self.description} (₹{self.amount})"

class BillingRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run_date = models.DateField()
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_due_subscriptions = models.PositiveIntegerField(default=0)
    invoices_created = models.PositiveIntegerField(default=0)
    invoices_skipped = models.PositiveIntegerField(default=0)
    total_billed_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    log_output = models.TextField(blank=True)

    def __str__(self):
        return f"Billing Run {self.run_date} ({self.invoices_created} invoices, ₹{self.total_billed_amount})"

