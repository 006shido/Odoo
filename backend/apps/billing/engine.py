import calendar
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice, InvoiceLineItem, BillingRun
from apps.discounts.models import Discount

def add_months(sourcedate: date, months: int) -> date:
    """Add months to a date with safe month-end day clamping (e.g. Jan 31 -> Feb 28)."""
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def calculate_next_period_and_billing_date(current_date: date, frequency: str):
    if frequency == 'daily':
        period_end = current_date
        next_billing = current_date + timedelta(days=1)
    elif frequency == 'weekly':
        period_end = current_date + timedelta(days=6)
        next_billing = current_date + timedelta(days=7)
    elif frequency == 'yearly':
        next_billing = date(current_date.year + 1, current_date.month, min(current_date.day, calendar.monthrange(current_date.year + 1, current_date.month)[1]))
        period_end = next_billing - timedelta(days=1)
    else:  # monthly default
        next_billing = add_months(current_date, 1)
        period_end = next_billing - timedelta(days=1)
    return period_end, next_billing

def run_billing_for_date(target_date: date = None) -> BillingRun:
    """
    Executes automated recurring billing for all eligible active subscriptions.
    Guarantees idempotency and safe retry:
    - Never bills a subscription twice for the same billing period.
    - Updates next_billing_date transactionally.
    - Automatically checks and applies valid discount rules.
    """
    if target_date is None:
        target_date = timezone.now().date()

    billing_run = BillingRun.objects.create(run_date=target_date)
    logs = [f"Starting billing run for date: {target_date}"]

    eligible_subs = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        next_billing_date__lte=target_date,
    ).select_related('customer', 'plan').prefetch_related('line_items')

    billing_run.total_due_subscriptions = eligible_subs.count()
    logs.append(f"Found {eligible_subs.count()} eligible active subscriptions due for billing.")

    invoices_created = 0
    invoices_skipped = 0
    total_billed = Decimal('0.00')

    for sub in eligible_subs:
        period_start = sub.next_billing_date
        period_end, next_billing = calculate_next_period_and_billing_date(period_start, sub.billing_frequency)

        # Check if already billed for this exact period
        already_billed = Invoice.objects.filter(
            subscription=sub,
            billing_period_start=period_start,
            billing_period_end=period_end
        ).exists()

        if already_billed:
            invoices_skipped += 1
            logs.append(f"Skipping {sub.subscription_number}: invoice already exists for period {period_start} - {period_end}.")
            continue

        try:
            with transaction.atomic():
                # Check for eligible active discount
                active_discount = Discount.objects.filter(
                    is_active=True,
                    scope=Discount.Scope.SUBSCRIPTION
                ).order_by('-value').first()

                discount_amount = Decimal('0.00')
                applied_discount_ref = None

                if active_discount and active_discount.is_eligible(sub.subtotal):
                    discount_amount = active_discount.calculate_discount_amount(sub.subtotal)
                    applied_discount_ref = active_discount
                    active_discount.times_used += 1
                    active_discount.save(update_fields=['times_used'])

                # Invoice numbering
                inv_count = Invoice.objects.count() + 1
                inv_number = f"INV-{timezone.now().year}-{inv_count:05d}"

                net_subtotal = max(Decimal('0.00'), sub.subtotal - discount_amount)
                tax_amount = (net_subtotal * (sub.tax_rate / Decimal('100.00'))).quantize(Decimal('0.01'))
                total_amount = net_subtotal + tax_amount

                # Due date based on payment terms
                due_days = 15
                if '30' in sub.payment_terms:
                    due_days = 30
                elif 'immediate' in sub.payment_terms.lower():
                    due_days = 0

                due_date = target_date + timedelta(days=due_days)

                invoice = Invoice.objects.create(
                    invoice_number=inv_number,
                    customer=sub.customer,
                    subscription=sub,
                    applied_discount=applied_discount_ref,
                    issue_date=target_date,
                    due_date=due_date,
                    billing_period_start=period_start,
                    billing_period_end=period_end,
                    status=Invoice.Status.CONFIRMED,
                    subtotal=sub.subtotal,
                    discount_amount=discount_amount,
                    tax_rate=sub.tax_rate,
                    tax_amount=tax_amount,
                    total_amount=total_amount,
                    paid_amount=Decimal('0.00'),
                    balance_due=total_amount,
                    notes=f"Recurring billing for {sub.subscription_number} ({sub.plan.name})",
                )

                # Create line items
                for line in sub.line_items.all():
                    InvoiceLineItem.objects.create(
                        invoice=invoice,
                        description=f"{line.product.name} ({sub.plan.name})",
                        quantity=line.quantity,
                        unit_price=line.unit_price,
                        tax_rate=line.tax_rate,
                        amount=line.total_price,
                    )

                # Advance next billing date
                sub.next_billing_date = next_billing
                sub.save(update_fields=['next_billing_date'])

                invoices_created += 1
                total_billed += total_amount
                logs.append(f"Created {invoice.invoice_number} for {sub.subscription_number} (₹{total_amount}). Next billing: {next_billing}.")

        except Exception as e:
            logs.append(f"Error billing {sub.subscription_number}: {str(e)}")

    billing_run.invoices_created = invoices_created
    billing_run.invoices_skipped = invoices_skipped
    billing_run.total_billed_amount = total_billed
    billing_run.completed_at = timezone.now()
    billing_run.log_output = "\n".join(logs)
    billing_run.save()

    return billing_run
