"""Versioned UI adapter. Django validates and calculates every persisted mutation."""
import json
import uuid
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.exceptions import ValidationError as ModelValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalogue.models import Product, ProductVariant, Tax
from apps.plans.models import SubscriptionPlan, PlanItem
from apps.quotations.models import Quotation, QuotationLineItem
from apps.subscriptions.models import Subscription, SubscriptionLineItem, SubscriptionEvent
from apps.billing.models import Invoice, InvoiceLineItem, BillingRun
from apps.billing.engine import run_billing_for_date
from apps.discounts.models import Discount
from apps.payments.models import Payment
from .models import Customer, CustomUser, WorkspaceSettings, WorkspaceAudit
from .serializers import UserSerializer

DEFAULT_SETTINGS = {
    'company_name': 'Brightloop', 'legal_name': 'Brightloop',
    'contact_email': 'billing@brightloop.io', 'phone': '',
    'address': {'street': '', 'city': '', 'state': '', 'postal_code': '', 'country': ''},
    'tax_id': '', 'currency': 'USD', 'currency_symbol': '$', 'billing_timezone': 'UTC',
    'default_tax_rate': '0.00', 'default_payment_terms': 'Net 15',
    'quotation_prefix': 'QUO-', 'invoice_prefix': 'INV-',
    'subscription_prefix': 'SUB-', 'payment_prefix': 'PAY-',
}


def base(obj):
    created = obj.created_at.isoformat()
    return {'id': str(obj.pk), 'created_at': created,
            'updated_at': getattr(obj, 'updated_at', obj.created_at).isoformat()}


def address(value):
    try:
        value = json.loads(value)
    except (ValueError, TypeError):
        value = {'street': value}
    return {key: str(value.get(key, '')) for key in DEFAULT_SETTINGS['address']} if isinstance(value, dict) else DEFAULT_SETTINGS['address']


def snapshot(user):
    internal = user.role in ('admin', 'staff')
    customers = Customer.objects.all() if internal else Customer.objects.filter(user=user)
    ids = list(customers.values_list('pk', flat=True))
    customer_map = {str(c.pk): c for c in customers}
    products = Product.objects.select_related('tax').prefetch_related('variants').order_by('-created_at')
    plans = SubscriptionPlan.objects.prefetch_related('items__product', 'items__variant').order_by('-created_at')
    if not internal:
        products = products.filter(is_active=True)
        plans = plans.filter(is_active=True)
    quotes = Quotation.objects.filter(customer_id__in=ids).select_related('customer', 'plan', 'discount').prefetch_related('line_items__product', 'converted_subscriptions').order_by('-created_at')
    subs = Subscription.objects.filter(customer_id__in=ids).select_related('customer', 'plan', 'source_quotation').prefetch_related('line_items__product', 'events').order_by('-created_at')
    invoices = Invoice.objects.filter(customer_id__in=ids).select_related('customer', 'subscription').prefetch_related('line_items').order_by('-created_at')
    payments = Payment.objects.filter(customer_id__in=ids).select_related('customer', 'invoice').order_by('-created_at')
    settings = WorkspaceSettings.objects.filter(pk=1).first()
    values = {**DEFAULT_SETTINGS, **(settings.values if settings else {})}
    customer_id = next((str(c.pk) for c in customer_map.values() if c.user_id == user.pk), None)
    result = {
        'currentUser': {**UserSerializer(user).data, 'customer_id': customer_id},
        'allUsers': list(UserSerializer(CustomUser.objects.all() if user.role == 'admin' else [user], many=True).data),
        'settings': values,
        'customers': [{**base(c), 'name': c.name, 'company_name': c.company_name,
                       'email': c.email, 'phone': c.phone, 'billing_address': address(c.billing_address),
                       'tax_id': c.tax_id, 'status': c.status if c.is_active else 'archived',
                       'notes': c.notes if internal else '', 'currency': c.currency,
                       'portal_user_id': str(c.user_id) if c.user_id else None} for c in customer_map.values()],
        'products': [{**base(p), 'name': p.name, 'code': p.sku, 'category': p.category,
                      'description': p.description, 'product_type': p.product_type,
                      'status': 'active' if p.is_active else 'archived', 'default_price': str(p.sales_price),
                      'sales_price': str(p.sales_price), 'cost_price': str(p.cost_price) if internal else '0.00',
                      'tax_rate': str(p.tax.rate) if p.tax else '0.00', 'notes': p.notes if internal else '',
                      'variants': [{'id': str(v.pk), 'name': v.name, 'sku': v.sku,
                                    'price_modifier': str(v.price_modifier), 'price': str(v.effective_price),
                                    'status': 'active' if v.is_active else 'archived'} for v in p.variants.all()]} for p in products],
        'plans': [], 'quotations': [], 'subscriptions': [], 'invoices': [], 'payments': [],
        'billingRuns': [], 'notifications': [], 'auditLog': [],
    }
    for p in plans:
        item = next(iter(p.items.all()), None)
        result['plans'].append({**base(p), 'name': p.name, 'code': p.code,
            'product_id': str(item.product_id) if item else '', 'product_name': item.product.name if item else '',
            'variant_id': str(item.variant_id) if item and item.variant_id else None,
            'variant_name': item.variant.name if item and item.variant else None,
            'frequency': p.billing_frequency, 'price': str(p.price), 'setup_fee': str(p.setup_fee),
            'minimum_quantity': p.minimum_quantity, 'status': 'active' if p.is_active else 'archived',
            'allow_pause': p.can_pause, 'auto_renew': p.auto_renew, 'description': p.description,
            'features': p.features, 'start_date': p.start_date, 'end_date': p.end_date,
            'auto_close_on_expiry': p.auto_close_on_expiry, 'can_close_early': p.can_close_early, 'can_renew': p.can_renew})
    result['discounts'] = [{**base(d), 'code': d.code, 'name': d.name, 'type': d.discount_type,
        'value': str(d.value), 'min_subtotal': str(d.minimum_purchase_amount), 'minimum_quantity': d.minimum_quantity,
        'usage_limit': d.usage_limit, 'usage_count': d.times_used, 'start_date': d.start_date or '',
        'end_date': d.end_date or '', 'status': 'active' if d.is_active else 'expired', 'scope': d.scope,
        'product_id': str(d.specific_product_id) if d.specific_product_id else None}
        for d in (Discount.objects.all().order_by('-created_at') if internal else Discount.objects.none())]
    for q in quotes:
        converted = next(iter(q.converted_subscriptions.all()), None)
        result['quotations'].append({**base(q), 'number': q.quotation_number, 'customer_id': str(q.customer_id),
            'customer_name': q.customer.company_name or q.customer.name, 'customer_email': q.customer.email,
            'status': q.status, 'items': [{'id': str(i.pk), 'product_id': str(i.product_id),
                'product_name': i.product.name, 'plan_id': str(q.plan_id) if q.plan_id else None,
                'plan_name': q.plan.name if q.plan else None, 'quantity': i.quantity,
                'unit_price': str(i.unit_price), 'amount': str(i.total_price)} for i in q.line_items.all()],
            'discount_id': str(q.discount_id) if q.discount_id else None, 'discount_code': q.discount.code if q.discount else None,
            'discount_amount': str(q.discount_amount), 'subtotal': str(q.subtotal), 'tax_rate': str(q.tax_rate),
            'tax_amount': str(q.tax_amount), 'total': str(q.total_amount), 'payment_terms': q.payment_terms,
            'issue_date': q.created_at.date(), 'expiry_date': q.valid_until, 'notes': q.notes,
            'accepted_at': q.accepted_at, 'accepted_by': q.accepted_by,
            'converted_subscription_id': str(converted.pk) if converted else None})
    for s in subs:
        result['subscriptions'].append({**base(s), 'number': s.subscription_number, 'customer_id': str(s.customer_id),
            'customer_name': s.customer.company_name or s.customer.name, 'customer_email': s.customer.email,
            'plan_id': str(s.plan_id), 'plan_name': s.plan.name, 'frequency': s.billing_frequency,
            'status': 'draft' if s.status in ('quotation', 'confirmed') else s.status,
            'start_date': s.start_date, 'end_date': s.expiry_date, 'next_billing_date': s.next_billing_date,
            'items': [{'id': str(i.pk), 'product_id': str(i.product_id), 'product_name': i.product.name,
                       'quantity': i.quantity, 'unit_price': str(i.unit_price), 'amount': str(i.total_price)} for i in s.line_items.all()],
            'source_quotation_id': str(s.source_quotation_id) if s.source_quotation_id else None,
            'source_quotation_number': s.source_quotation.quotation_number if s.source_quotation else None,
            'recurring_amount': str(s.subtotal), 'tax_rate': str(s.tax_rate), 'tax_amount': str(s.tax_amount),
            'total_recurring': str(s.total_amount), 'auto_renew': s.auto_renew, 'can_pause': s.plan.can_pause,
            'can_close_early': s.plan.can_close_early, 'can_renew': s.plan.can_renew, 'pause_reason': s.pause_reason,
            'events': [{'id': str(e.pk), 'event_type': {'active': 'resumed' if e.from_status == 'paused' else 'activated',
                        'paused': 'paused', 'closed': 'closed', 'expired': 'expired'}.get(e.to_status, 'created'),
                        'actor': e.actor, 'timestamp': e.timestamp, 'notes': e.reason} for e in s.events.all()]})
    for i in invoices:
        status = {'confirmed': 'partially_paid' if i.paid_amount > 0 else 'issued', 'cancelled': 'void'}.get(i.status, i.status)
        result['invoices'].append({**base(i), 'number': i.invoice_number, 'customer_id': str(i.customer_id),
            'customer_name': i.customer.company_name or i.customer.name, 'customer_email': i.customer.email,
            'subscription_id': str(i.subscription_id) if i.subscription_id else None,
            'subscription_number': i.subscription.subscription_number if i.subscription else None,
            'billing_period_start': i.billing_period_start, 'billing_period_end': i.billing_period_end,
            'status': status, 'is_overdue': i.is_overdue and status not in ('void', 'draft'),
            'issue_date': i.issue_date, 'due_date': i.due_date,
            'items': [{'id': str(l.pk), 'description': l.description, 'quantity': l.quantity,
                       'unit_price': str(l.unit_price), 'amount': str(l.amount)} for l in i.line_items.all()],
            'subtotal': str(i.subtotal), 'discount_amount': str(i.discount_amount), 'tax_rate': str(i.tax_rate),
            'tax_amount': str(i.tax_amount), 'total': str(i.total_amount), 'paid_amount': str(i.paid_amount),
            'balance_due': str(i.balance_due), 'notes': i.notes})
    for p in payments:
        result['payments'].append({**base(p), 'number': p.payment_number, 'customer_id': str(p.customer_id),
            'customer_name': p.customer.company_name or p.customer.name, 'amount': str(p.amount),
            'unallocated_amount': '0.00', 'method': p.payment_method, 'reference': p.transaction_reference,
            'received_date': p.payment_date, 'status': 'completed', 'notes': p.notes,
            'allocations': [{'id': str(p.pk), 'invoice_id': str(p.invoice_id), 'invoice_number': p.invoice.invoice_number,
                             'amount': str(p.amount), 'allocated_at': p.created_at}]})
    if internal:
        result['billingRuns'] = [billing_dto(r) for r in BillingRun.objects.order_by('-started_at')[:100]]
        result['auditLog'] = list(WorkspaceAudit.objects.order_by('-timestamp')[:200].values())
    # Reporting values use server-side Decimal arithmetic; charts only format these totals.
    mrr = Decimal('0')
    factors = {'daily': Decimal(365) / 12, 'weekly': Decimal(52) / 12,
               'monthly': Decimal(1), 'yearly': Decimal(1) / 12}
    for sub in result['subscriptions']:
        if sub['status'] == 'active':
            mrr += Decimal(sub['recurring_amount']) * factors.get(sub['frequency'], Decimal(1))
    months = []
    today = timezone.now().date()
    for offset in range(11, -1, -1):
        index = today.year * 12 + today.month - 1 - offset
        year, month = divmod(index, 12)
        key = f'{year:04d}-{month + 1:02d}'
        invoiced = sum((Decimal(i['total']) for i in result['invoices'] if i['status'] not in ('draft', 'void') and str(i['issue_date']).startswith(key)), Decimal('0'))
        collected = sum((Decimal(p['amount']) for p in result['payments'] if str(p['received_date']).startswith(key)), Decimal('0'))
        months.append({'month': key, 'invoiced': str(invoiced.quantize(Decimal('0.01'))), 'collected': str(collected.quantize(Decimal('0.01')))})
    result['metrics'] = {'mrr': str(mrr.quantize(Decimal('0.01'))),
                         'arr': str((mrr * 12).quantize(Decimal('0.01'))), 'revenue_months': months}
    return result


def billing_dto(run):
    logs = run.log_output.splitlines()
    errors = sum(line.startswith('Error') for line in logs)
    return {'id': str(run.pk), 'run_date': run.run_date, 'processed_at': run.completed_at or run.started_at,
            'subscriptions_checked': run.total_due_subscriptions, 'invoices_created': run.invoices_created,
            'invoices_skipped': run.invoices_skipped, 'errors_count': errors,
            'status': 'partial' if errors else 'completed', 'log': logs}


def money(value):
    return serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0')).run_validation(value)


def positive(value):
    return serializers.IntegerField(min_value=1).run_validation(value)


def day(value):
    return serializers.DateField().run_validation(value)


def persist(obj):
    obj.full_clean()
    obj.save()
    return obj


def number(prefix):
    return f'{prefix}{timezone.now().year}-{uuid.uuid4().hex[:12].upper()}'


def owned(model, pk, user):
    query = model.objects.select_for_update()
    if user.role == 'customer':
        query = query.filter(user=user) if model is Customer else query.filter(customer__user=user)
    return get_object_or_404(query, pk=pk)


def apply_fields(obj, data, mapping):
    for source, target in mapping.items():
        if source in data:
            setattr(obj, target, data[source])
    return obj


def create_quote(data, user, values):
    customer = owned(Customer, data.get('customer_id'), user)
    items = data.get('items', [])
    if not isinstance(items, list) or not items or any(not isinstance(item, dict) for item in items):
        raise ValidationError('Add at least one quotation line.')
    plan_ids = {item.get('plan_id') for item in items if item.get('plan_id')}
    if len(plan_ids) != 1:
        raise ValidationError('Select one subscription plan per quotation.')
    plan = get_object_or_404(SubscriptionPlan, pk=next(iter(plan_ids)), is_active=True)
    today = timezone.now().date()
    if (plan.start_date and today < plan.start_date) or (plan.end_date and today > plan.end_date):
        raise ValidationError('This plan is outside its availability dates.')
    expiry = day(data.get('expiry_date'))
    if expiry < today:
        raise ValidationError('Quotation expiry must be today or later.')
    q = Quotation.objects.create(quotation_number=number(values['quotation_prefix']), customer=customer,
        plan=plan, valid_until=expiry, payment_terms=data.get('payment_terms') or values['default_payment_terms'],
        notes=data.get('notes', ''), tax_rate=money(values['default_tax_rate']))
    for item in items:
        product = get_object_or_404(Product, pk=item.get('product_id'), is_active=True)
        quantity = positive(item.get('quantity'))
        if quantity < plan.minimum_quantity:
            raise ValidationError('Quantity is below the plan minimum.')
        if not plan.items.filter(product=product).exists():
            raise ValidationError('The product does not belong to the selected plan.')
        price = plan.price if user.role == 'customer' else money(item.get('unit_price'))
        QuotationLineItem.objects.create(quotation=q, product=product, quantity=quantity, unit_price=price)
    rates = {str(i.product.tax.rate) if i.product.tax else str(values['default_tax_rate']) for i in q.line_items.select_related('product__tax')}
    if len(rates) > 1:
        raise ValidationError('Use products with the same tax rate in one quotation.')
    q.tax_rate = money(next(iter(rates)))
    q.calculate_totals()
    if data.get('discount_id'):
        if user.role == 'customer':
            raise PermissionDenied('Discounts must be assigned by staff.')
        discount = get_object_or_404(Discount.objects.select_for_update(), pk=data['discount_id'])
        lines = list(q.line_items.all())
        eligible = [l for l in lines if discount.scope != 'product' or l.product_id == discount.specific_product_id]
        subtotal = sum((l.total_price for l in eligible), Decimal('0'))
        if not eligible or not discount.is_eligible(q.subtotal, sum(l.quantity for l in lines), discount.specific_product_id):
            raise ValidationError('Discount is not eligible for this quotation.')
        q.discount = discount
        q.discount_amount = discount.calculate_discount_amount(subtotal)
        q.calculate_totals()
    return str(q.pk)


def convert_quote(q, user, values):
    if q.status != 'accepted' or q.converted_subscriptions.exists():
        raise ValidationError('Only an accepted, unconverted quotation can be converted.')
    if not q.plan_id:
        raise ValidationError('The quotation needs a subscription plan.')
    today = timezone.now().date()
    s = Subscription.objects.create(subscription_number=number(values['subscription_prefix']),
        customer=q.customer, plan=q.plan, source_quotation=q, status='active', start_date=today,
        expiry_date=q.plan.end_date, next_billing_date=today, billing_frequency=q.plan.billing_frequency,
        payment_terms=q.payment_terms, subtotal=q.subtotal, tax_rate=q.tax_rate, tax_amount=q.tax_amount,
        total_amount=q.total_amount, auto_renew=q.plan.auto_renew, discount=q.discount)
    for item in q.line_items.all():
        SubscriptionLineItem.objects.create(subscription=s, product=item.product, variant=item.variant,
            quantity=item.quantity, unit_price=item.unit_price, tax_rate=q.tax_rate)
    SubscriptionEvent.objects.create(subscription=s, from_status='quotation', to_status='active',
        actor=user.email, reason=f'Converted from {q.quotation_number}')
    q.status = 'converted'
    q.save(update_fields=['status'])
    return str(s.pk)


def execute(command, data, user, workspace):
    values = {**DEFAULT_SETTINGS, **workspace.values}
    pk = data.get('id')
    payload = data.get('data', data)
    if not isinstance(payload, dict):
        raise ValidationError('The command data must be an object.')
    if user.role == 'customer' and command not in ('createQuotation', 'acceptQuotation', 'rejectQuotation', 'setSubscriptionAutoRenew', 'purchasePlan'):
        raise PermissionDenied('This action is restricted to internal staff.')
    if user.role != 'admin' and command in ('createProduct', 'updateProduct', 'createDiscount', 'updateDiscount', 'updateSettings'):
        raise PermissionDenied('Administrator access is required.')
    if command in ('createCustomer', 'updateCustomer', 'archiveCustomer'):
        obj = Customer() if command == 'createCustomer' else owned(Customer, pk, user)
        apply_fields(obj, payload, {k: k for k in ('name', 'company_name', 'email', 'phone', 'tax_id', 'notes', 'currency', 'status')})
        if 'billing_address' in payload:
            obj.billing_address = json.dumps(payload['billing_address'])
        if command == 'archiveCustomer':
            obj.status = 'archived'
        obj.is_active = obj.status != 'archived'
        return str(persist(obj).pk)
    if command in ('createProduct', 'updateProduct'):
        obj = Product() if command == 'createProduct' else get_object_or_404(Product.objects.select_for_update(), pk=pk)
        apply_fields(obj, payload, {'name': 'name', 'code': 'sku', 'category': 'category', 'description': 'description',
                     'product_type': 'product_type', 'notes': 'notes', 'default_price': 'sales_price', 'cost_price': 'cost_price'})
        if 'status' in payload:
            obj.is_active = payload['status'] == 'active'
        if 'tax_rate' in payload:
            rate = money(payload['tax_rate'])
            if rate > 100:
                raise ValidationError('Tax rate cannot exceed 100%.')
            obj.tax = Tax.objects.get_or_create(name=f'Tax {rate}%', rate=rate)[0]
        obj.sales_price = money(obj.sales_price)
        obj.cost_price = money(obj.cost_price)
        persist(obj)
        variants = payload.get('variants', [])
        if not isinstance(variants, list) or any(not isinstance(item, dict) for item in variants):
            raise ValidationError('Variants must be a list of objects.')
        for item in variants:
            variant = ProductVariant.objects.filter(product=obj, sku=item.get('sku')).first() or ProductVariant(product=obj)
            variant.name, variant.sku = item.get('name', ''), item.get('sku', '')
            variant.price_modifier = money(item.get('price_modifier', '0'))
            variant.is_active = item.get('status', 'active') == 'active'
            persist(variant)
        return str(obj.pk)
    if command in ('createPlan', 'updatePlan'):
        obj = SubscriptionPlan() if command == 'createPlan' else get_object_or_404(SubscriptionPlan.objects.select_for_update(), pk=pk)
        apply_fields(obj, payload, {'name': 'name', 'code': 'code', 'frequency': 'billing_frequency', 'price': 'price',
            'setup_fee': 'setup_fee', 'features': 'features', 'minimum_quantity': 'minimum_quantity', 'allow_pause': 'can_pause',
            'auto_renew': 'auto_renew', 'description': 'description', 'auto_close_on_expiry': 'auto_close_on_expiry',
            'can_close_early': 'can_close_early', 'can_renew': 'can_renew'})
        for key in ('start_date', 'end_date'):
            if key in payload:
                setattr(obj, key, day(payload[key]) if payload[key] else None)
        if obj.start_date and obj.end_date and obj.start_date > obj.end_date:
            raise ValidationError('Plan end date must follow its start date.')
        if Decimal(str(obj.price)) < 0 or Decimal(str(obj.setup_fee)) < 0 or obj.minimum_quantity < 1:
            raise ValidationError('Prices must be nonnegative and minimum quantity at least one.')
        if not isinstance(obj.features, list) or not all(isinstance(v, str) for v in obj.features):
            raise ValidationError('Plan features must be text.')
        if Decimal(str(obj.setup_fee)) != 0:
            raise ValidationError('One-time setup fee billing is not supported yet. Set setup fee to zero.')
        if 'status' in payload:
            obj.is_active = payload['status'] == 'active'
        persist(obj)
        if payload.get('product_id'):
            product = get_object_or_404(Product, pk=payload['product_id'], is_active=True)
            item = obj.items.first() or PlanItem(plan=obj)
            item.product, item.quantity, item.unit_price = product, obj.minimum_quantity, obj.price
            persist(item)
        if not obj.items.exists():
            raise ValidationError('A plan must contain a product.')
        return str(obj.pk)
    if command in ('createDiscount', 'updateDiscount'):
        obj = Discount() if command == 'createDiscount' else get_object_or_404(Discount.objects.select_for_update(), pk=pk)
        apply_fields(obj, payload, {'code': 'code', 'name': 'name', 'type': 'discount_type', 'value': 'value',
            'min_subtotal': 'minimum_purchase_amount', 'minimum_quantity': 'minimum_quantity', 'scope': 'scope', 'usage_limit': 'usage_limit'})
        for key in ('start_date', 'end_date'):
            if key in payload:
                setattr(obj, key, day(payload[key]) if payload[key] else None)
        if 'product_id' in payload:
            obj.specific_product = get_object_or_404(Product, pk=payload['product_id']) if payload['product_id'] else None
        if 'status' in payload:
            obj.is_active = payload['status'] == 'active'
        if obj.start_date and obj.end_date and obj.start_date > obj.end_date:
            raise ValidationError('Discount end date must follow its start date.')
        if money(obj.value) > 100 and obj.discount_type == 'percentage':
            raise ValidationError('Percentage discounts cannot exceed 100%.')
        if obj.scope == 'product' and not obj.specific_product_id:
            raise ValidationError('Select a product for this discount.')
        return str(persist(obj).pk)
    if command == 'purchasePlan':
        # Synthetic checkout is restricted to the explicitly enabled local demo identity.
        if not (settings.DEBUG and settings.ENABLE_LOCAL_DEMO_LOGIN and user.email == 'demo-login-customer@example.invalid'):
            raise PermissionDenied('Online payment collection is not configured. Please request a quotation.')
        plan = get_object_or_404(SubscriptionPlan, pk=payload.get('plan_id'), is_active=True)
        item = plan.items.first()
        if not item:
            raise ValidationError('This plan has no product.')
        qid = create_quote({'customer_id': payload.get('customer_id'), 'expiry_date': timezone.now().date(),
            'items': [{'product_id': str(item.product_id), 'plan_id': str(plan.pk),
                       'quantity': plan.minimum_quantity, 'unit_price': str(plan.price)}]}, user, values)
        quote = Quotation.objects.get(pk=qid)
        quote.status = 'accepted'
        quote.save()
        sid = convert_quote(quote, user, values)
        sub = Subscription.objects.get(pk=sid)
        from apps.billing.engine import calculate_next_period_and_billing_date
        end, next_date = calculate_next_period_and_billing_date(sub.start_date, sub.billing_frequency)
        invoice = Invoice.objects.create(invoice_number=number(values['invoice_prefix']), customer=sub.customer,
            subscription=sub, issue_date=sub.start_date, due_date=sub.start_date, billing_period_start=sub.start_date,
            billing_period_end=end, status='confirmed', subtotal=sub.subtotal, tax_rate=sub.tax_rate,
            tax_amount=sub.tax_amount, total_amount=sub.total_amount, balance_due=sub.total_amount,
            notes='DEMO simulated checkout. No funds transferred.')
        for line in sub.line_items.all():
            InvoiceLineItem.objects.create(invoice=invoice, description=line.product.name, quantity=line.quantity,
                unit_price=line.unit_price, tax_rate=line.tax_rate, amount=line.total_price)
        payment = Payment(payment_number=number(values['payment_prefix']), customer=sub.customer, invoice=invoice,
            amount=invoice.total_amount, payment_date=sub.start_date, payment_method=payload.get('method'),
            transaction_reference=payload.get('reference', ''), notes='DEMO simulation; no real payment credentials stored.')
        persist(payment)
        sub.next_billing_date = next_date
        sub.save(update_fields=['next_billing_date'])
        return sid
    if command == 'createQuotation':
        return create_quote(payload, user, values)
    if command in ('sendQuotation', 'acceptQuotation', 'rejectQuotation', 'convertQuotationToSubscription'):
        obj = owned(Quotation, pk, user)
        if command == 'convertQuotationToSubscription':
            return convert_quote(obj, user, values)
        expected = ('draft',) if command == 'sendQuotation' else ('sent',)
        if obj.status not in expected:
            raise ValidationError('The quotation cannot make that transition.')
        if obj.valid_until and obj.valid_until < timezone.now().date():
            raise ValidationError('This quotation has expired.')
        obj.status = {'sendQuotation': 'sent', 'acceptQuotation': 'accepted', 'rejectQuotation': 'rejected'}[command]
        if obj.status == 'accepted':
            obj.accepted_at, obj.accepted_by = timezone.now(), user.email
        obj.save()
        return str(obj.pk)
    if command == 'createSubscription':
        plan = get_object_or_404(SubscriptionPlan, pk=payload.get('plan_id'), is_active=True)
        items = list(plan.items.all())
        if not items:
            raise ValidationError('This plan has no product lines.')
        qid = create_quote({'customer_id': payload.get('customer_id'), 'expiry_date': timezone.now().date(),
            'items': [{'product_id': str(i.product_id), 'plan_id': str(plan.pk), 'quantity': max(i.quantity, plan.minimum_quantity),
                       'unit_price': str(plan.price)} for i in items]}, user, values)
        q = Quotation.objects.get(pk=qid)
        q.status = 'accepted'
        q.save()
        sid = convert_quote(q, user, values)
        sub = Subscription.objects.get(pk=sid)
        if payload.get('start_date'):
            sub.start_date = day(payload['start_date'])
            sub.next_billing_date = sub.start_date
        if 'auto_renew' in payload:
            if not isinstance(payload['auto_renew'], bool):
                raise ValidationError('auto_renew must be a boolean.')
            sub.auto_renew = payload['auto_renew']
        sub.save()
        return sid
    if command in ('activateSubscription', 'pauseSubscription', 'resumeSubscription', 'closeSubscription', 'setSubscriptionAutoRenew'):
        obj = owned(Subscription, pk, user)
        if command == 'setSubscriptionAutoRenew':
            if not isinstance(data.get('enabled'), bool):
                raise ValidationError('enabled must be a boolean.')
            if data['enabled'] and not obj.plan.can_renew:
                raise ValidationError('This plan does not allow renewal.')
            obj.auto_renew = data['enabled']
            obj.save(update_fields=['auto_renew'])
            return str(obj.pk)
        rules = {'activateSubscription': (('draft', 'confirmed'), 'active', True),
                 'pauseSubscription': (('active',), 'paused', obj.plan.can_pause),
                 'resumeSubscription': (('paused',), 'active', True),
                 'closeSubscription': (('active', 'paused', 'draft'), 'closed', obj.plan.can_close_early)}
        allowed, target, enabled = rules[command]
        if obj.status not in allowed or not enabled:
            raise ValidationError('The subscription cannot make that transition.')
        old = obj.status
        obj.status = target
        if target == 'paused':
            obj.paused_at, obj.pause_reason = timezone.now(), data.get('reason', '')
        if command == 'resumeSubscription':
            obj.next_billing_date = timezone.now().date()
        if target == 'closed':
            obj.closed_at = timezone.now()
        obj.save()
        SubscriptionEvent.objects.create(subscription=obj, from_status=old, to_status=target, actor=user.email, reason=data.get('reason', ''))
        return str(obj.pk)
    if command == 'runBillingEngine':
        run = run_billing_for_date(day(data['targetDate']) if data.get('targetDate') else None)
        return str(run.pk)
    if command in ('issueInvoice', 'voidInvoice'):
        obj = owned(Invoice, pk, user)
        if obj.status in ('paid', 'cancelled') or obj.paid_amount > 0:
            raise ValidationError('A paid or cancelled invoice cannot be changed.')
        obj.status = 'confirmed' if command == 'issueInvoice' else 'cancelled'
        obj.save(update_fields=['status'])
        return str(obj.pk)
    if command == 'recordPayment':
        customer = owned(Customer, payload.get('customer_id'), user)
        amount = money(payload.get('amount'))
        allocations = payload.get('allocations') or []
        if not isinstance(allocations, list) or any(not isinstance(a, dict) for a in allocations):
            raise ValidationError('Allocations must be a list of objects.')
        if not allocations or amount <= 0 or sum((money(a.get('amount')) for a in allocations), Decimal('0')) != amount:
            raise ValidationError('Allocate the full positive payment amount to invoices. Unallocated credit is not supported.')
        # Lock every invoice in stable order before changing any balance.
        invoice_ids = [str(a.get('invoice_id')) for a in allocations]
        if len(set(invoice_ids)) != len(invoice_ids):
            raise ValidationError('Allocate each invoice only once.')
        locked = {str(i.pk): i for i in Invoice.objects.select_for_update().filter(pk__in=invoice_ids, customer=customer).order_by('pk')}
        payments = []
        for a in allocations:
            invoice = locked.get(str(a['invoice_id']))
            if not invoice or invoice.status != 'confirmed' or money(a['amount']) <= 0:
                raise ValidationError('Select an issued invoice belonging to this customer.')
            payment = Payment(customer=customer, invoice=invoice, payment_number=number(values['payment_prefix']),
                amount=money(a['amount']), payment_date=day(payload.get('received_date')),
                payment_method=payload.get('method'), transaction_reference=payload.get('reference', ''), notes=payload.get('notes', ''))
            persist(payment)
            payments.append(str(payment.pk))
        return payments[0]
    if command == 'updateSettings':
        unknown = set(payload) - set(DEFAULT_SETTINGS)
        if unknown:
            raise ValidationError('Unknown workspace settings.')
        updated = {**values, **payload}
        if any(not isinstance(value, str) for key, value in updated.items() if key != 'address'):
            raise ValidationError('Workspace settings must be text values.')
        if len(updated['currency']) != 3:
            raise ValidationError('Use a three-letter currency code.')
        money(updated['default_tax_rate'])
        if Decimal(str(updated['default_tax_rate'])) > 100:
            raise ValidationError('Tax rate cannot exceed 100%.')
        if not isinstance(updated['address'], dict):
            raise ValidationError('Billing address must be an object.')
        workspace.values = updated
        workspace.save(update_fields=['values'])
        return '1'
    raise ValidationError('Unsupported workspace action.')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def workspace_view(request):
    if request.method == 'GET':
        return Response(snapshot(request.user))
    command = request.data.get('action')
    data = request.data.get('payload', {})
    if not isinstance(command, str) or not isinstance(data, dict):
        raise ValidationError('An action and payload object are required.')
    try:
        with transaction.atomic():
            WorkspaceSettings.objects.get_or_create(pk=1)
            workspace = WorkspaceSettings.objects.select_for_update().get(pk=1)
            result = execute(command, data, request.user, workspace)
            WorkspaceAudit.objects.create(actor=request.user.email, action=command,
                entity_type='workspace', entity_id=str(result), details=f'{command} completed')
        return Response({'id': result})
    except ModelValidationError as error:
        raise ValidationError(error.message_dict if hasattr(error, 'message_dict') else error.messages)
    except (ValueError, TypeError, InvalidOperation):
        raise ValidationError('Invalid field value. Check dates, IDs, quantities and amounts.')
