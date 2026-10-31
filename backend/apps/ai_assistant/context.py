from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.billing.models import Invoice
from apps.identity.models import CustomUser
from apps.payments.models import Payment
from apps.subscriptions.models import Subscription


def _money(value):
    return str(value or Decimal('0.00'))


def build_billing_context(user):
    if user.role not in (CustomUser.Role.ADMIN, CustomUser.Role.STAFF):
        raise PermissionDenied('Billing insights are available to staff and admins only.')

    today = timezone.localdate()
    month_start = today.replace(day=1)
    invoices = Invoice.objects.exclude(status=Invoice.Status.CANCELLED)
    outstanding = invoices.filter(balance_due__gt=0)
    overdue = outstanding.filter(due_date__lt=today)
    collections = Payment.objects.filter(payment_date__gte=month_start, payment_date__lte=today)
    next_renewals = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        expiry_date__gte=today,
        expiry_date__lte=today + timedelta(days=30),
    )

    totals = invoices.aggregate(
        invoiced=Sum('total_amount'),
        paid=Sum('paid_amount'),
    )
    return {
        'as_of': today.isoformat(),
        'currency': 'INR',
        'billing_summary': {
            'invoice_count': invoices.count(),
            'total_invoiced': _money(totals['invoiced']),
            'total_paid_against_invoices': _money(totals['paid']),
            'outstanding_invoice_count': outstanding.count(),
            'outstanding_amount': _money(outstanding.aggregate(total=Sum('balance_due'))['total']),
            'overdue_invoice_count': overdue.count(),
            'overdue_amount': _money(overdue.aggregate(total=Sum('balance_due'))['total']),
            'collected_this_month': _money(collections.aggregate(total=Sum('amount'))['total']),
            'active_subscriptions': Subscription.objects.filter(status=Subscription.Status.ACTIVE).count(),
            'paused_subscriptions': Subscription.objects.filter(status=Subscription.Status.PAUSED).count(),
            'renewals_due_in_30_days': next_renewals.count(),
        },
    }


def build_renewal_context(user):
    if user.role not in (CustomUser.Role.ADMIN, CustomUser.Role.STAFF):
        raise PermissionDenied('Renewal insights are available to staff and admins only.')

    today = timezone.localdate()
    window_end = today + timedelta(days=90)
    subscriptions = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        expiry_date__gte=today,
        expiry_date__lte=window_end,
    ).select_related('customer', 'plan').order_by('expiry_date')[:40]

    records = []
    for subscription in subscriptions:
        days_to_expiry = (subscription.expiry_date - today).days
        open_invoices = Invoice.objects.filter(
            subscription=subscription,
            balance_due__gt=0,
        )
        overdue_invoices = open_invoices.filter(due_date__lt=today)
        overdue_amount = overdue_invoices.aggregate(total=Sum('balance_due'))['total'] or Decimal('0.00')
        open_amount = open_invoices.aggregate(total=Sum('balance_due'))['total'] or Decimal('0.00')

        if overdue_amount > 0:
            risk_level = 'high'
            reason = 'Has overdue invoice balance'
        elif open_amount > 0 and days_to_expiry <= 30:
            risk_level = 'high'
            reason = 'Renewal is within 30 days and an invoice is still open'
        elif open_amount > 0:
            risk_level = 'medium'
            reason = 'Has an outstanding invoice balance'
        elif days_to_expiry <= 30:
            risk_level = 'medium'
            reason = 'Renewal is within 30 days'
        else:
            risk_level = 'watch'
            reason = 'Renewal is within 90 days'

        records.append({
            'subscription_number': subscription.subscription_number,
            'plan': subscription.plan.name,
            'billing_frequency': subscription.billing_frequency,
            'renewal_date': subscription.expiry_date.isoformat(),
            'days_to_renewal': days_to_expiry,
            'risk_level': risk_level,
            'reason': reason,
            'open_invoice_count': open_invoices.count(),
            'outstanding_amount_inr': _money(open_amount),
            'overdue_amount_inr': _money(overdue_amount),
        })

    return {
        'as_of': today.isoformat(),
        'currency': 'INR',
        'risk_method': 'Deterministic rules based on renewal date and open/overdue invoice balances.',
        'subscriptions_reviewed': len(records),
        'renewals': records,
    }


def build_customer_support_context(user):
    if user.role != CustomUser.Role.CUSTOMER:
        raise PermissionDenied('Customer support mode is for customer accounts only.')

    customer = getattr(user, 'customer_profile', None)
    if customer is None:
        raise PermissionDenied('This account is not linked to a customer profile.')

    today = timezone.localdate()
    subscriptions = customer.subscriptions.select_related('plan').order_by('-created_at')[:10]
    invoices = customer.invoices.exclude(status=Invoice.Status.CANCELLED).order_by('-issue_date')[:12]
    payments = customer.payments.select_related('invoice').order_by('-payment_date')[:10]

    return {
        'as_of': today.isoformat(),
        'currency': 'INR',
        'account_summary': {
            'subscriptions': [{
                'subscription_number': sub.subscription_number,
                'plan': sub.plan.name,
                'status': sub.status,
                'billing_frequency': sub.billing_frequency,
                'next_billing_date': sub.next_billing_date.isoformat() if sub.next_billing_date else None,
                'expiry_date': sub.expiry_date.isoformat() if sub.expiry_date else None,
                'recurring_total_inr': _money(sub.total_amount),
            } for sub in subscriptions],
            'invoices': [{
                'invoice_number': invoice.invoice_number,
                'status': invoice.status,
                'issue_date': invoice.issue_date.isoformat(),
                'due_date': invoice.due_date.isoformat(),
                'total_inr': _money(invoice.total_amount),
                'paid_inr': _money(invoice.paid_amount),
                'balance_due_inr': _money(invoice.balance_due),
                'is_overdue': invoice.balance_due > 0 and invoice.due_date < today,
            } for invoice in invoices],
            'recent_payments': [{
                'payment_number': payment.payment_number,
                'invoice_number': payment.invoice.invoice_number,
                'amount_inr': _money(payment.amount),
                'payment_date': payment.payment_date.isoformat(),
                'method': payment.payment_method,
            } for payment in payments],
        },
    }


def build_context(user, mode):
    if mode == 'billing_copilot':
        return build_billing_context(user)
    if mode == 'renewal_insights':
        return build_renewal_context(user)
    if mode == 'customer_support':
        return build_customer_support_context(user)
    raise PermissionDenied('This AI mode is not available.')
