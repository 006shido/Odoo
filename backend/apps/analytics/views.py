from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice
from apps.payments.models import Payment
from apps.identity.models import Customer, CustomUser

@api_view(['GET'])
def finance_dashboard_metrics(request):
    """
    Control Tower & Financial Health Dashboard:
    Real-time aggregations for Finance Lead and Admin.
    """
    today = timezone.now().date()
    soon_threshold = today + timedelta(days=30)

    # Subscriptions summary
    total_subs = Subscription.objects.count()
    active_subs = Subscription.objects.filter(status=Subscription.Status.ACTIVE).count()
    paused_subs = Subscription.objects.filter(status=Subscription.Status.PAUSED).count()
    closed_subs = Subscription.objects.filter(status=Subscription.Status.CLOSED).count()
    renewals_due_soon = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        expiry_date__lte=soon_threshold,
        expiry_date__gte=today
    ).count()

    # Financial breakdown
    invoice_aggregates = Invoice.objects.aggregate(
        total_invoiced=Sum('total_amount'),
        total_collected=Sum('paid_amount'),
        total_outstanding=Sum('balance_due'),
    )
    total_invoiced = invoice_aggregates['total_invoiced'] or Decimal('0.00')
    total_collected = invoice_aggregates['total_collected'] or Decimal('0.00')
    total_outstanding = invoice_aggregates['total_outstanding'] or Decimal('0.00')

    # Overdue invoices
    overdue_qs = Invoice.objects.filter(
        ~Q(status=Invoice.Status.PAID),
        due_date__lt=today,
    )
    overdue_count = overdue_qs.count()
    overdue_amount = overdue_qs.aggregate(sum=Sum('balance_due'))['sum'] or Decimal('0.00')

    # Normalized estimated MRR (Monthly Recurring Revenue)
    mrr_estimate = Decimal('0.00')
    for sub in Subscription.objects.filter(status=Subscription.Status.ACTIVE):
        if sub.billing_frequency == 'monthly':
            mrr_estimate += sub.subtotal
        elif sub.billing_frequency == 'yearly':
            mrr_estimate += (sub.subtotal / Decimal('12.00')).quantize(Decimal('0.01'))
        elif sub.billing_frequency == 'weekly':
            mrr_estimate += (sub.subtotal * Decimal('4.33')).quantize(Decimal('0.01'))
        elif sub.billing_frequency == 'daily':
            mrr_estimate += (sub.subtotal * Decimal('30.00')).quantize(Decimal('0.01'))

    # Recent invoices
    recent_invoices = list(Invoice.objects.select_related('customer').order_by('-created_at')[:5].values(
        'id', 'invoice_number', 'customer__name', 'customer__company_name',
        'issue_date', 'due_date', 'total_amount', 'paid_amount', 'balance_due', 'status'
    ))

    # Control Tower Alerts
    alerts = []
    if overdue_count > 0:
        alerts.append({
            'type': 'warning',
            'title': 'Overdue Receivables',
            'message': f"{overdue_count} invoice(s) totaling ₹{overdue_amount:,.2f} are past due.",
        })
    if renewals_due_soon > 0:
        alerts.append({
            'type': 'info',
            'title': 'Upcoming Contract Renewals',
            'message': f"{renewals_due_soon} active subscription(s) reach expiry within 30 days.",
        })
    if paused_subs > 0:
        alerts.append({
            'type': 'info',
            'title': 'Paused Subscriptions',
            'message': f"{paused_subs} subscription(s) are currently paused and not generating invoices.",
        })

    return Response({
        'subscriptions': {
            'total': total_subs,
            'active': active_subs,
            'paused': paused_subs,
            'closed': closed_subs,
            'renewals_due_soon': renewals_due_soon,
        },
        'financials': {
            'total_invoiced': str(total_invoiced),
            'total_collected': str(total_collected),
            'total_outstanding': str(total_outstanding),
            'overdue_count': overdue_count,
            'overdue_amount': str(overdue_amount),
            'estimated_mrr': str(mrr_estimate),
        },
        'recent_invoices': recent_invoices,
        'alerts': alerts,
    })
