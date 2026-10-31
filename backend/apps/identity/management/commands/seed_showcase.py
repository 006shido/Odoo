"""Add idempotent showcase records without modifying existing accounts or records."""
import json
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.identity.models import Customer
from apps.catalogue.models import Tax, Product, ProductVariant
from apps.plans.models import SubscriptionPlan, PlanItem
from apps.quotations.models import Quotation, QuotationLineItem
from apps.subscriptions.models import Subscription, SubscriptionLineItem, SubscriptionEvent
from apps.billing.models import Invoice, InvoiceLineItem
from apps.payments.models import Payment
from apps.discounts.models import Discount


class Command(BaseCommand):
    help = 'Add clearly labeled DEMO showcase data; safe to rerun; no account/password changes.'

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.now().date()
        tax, _ = Tax.objects.get_or_create(name='DEMO Standard Tax', defaults={'rate': Decimal('10.00')})
        customers = []
        for index, company in enumerate(['Acme Cloud', 'Northstar Studio', 'Orbit Retail', 'Summit Labs', 'Cedar Analytics', 'Harbor Design']):
            customer, _ = Customer.objects.get_or_create(email=f'demo-{index+1}@example.invalid', defaults={
                'name': ['Alex Morgan','Priya Shah','Sam Lee','Jordan Taylor','Casey Chen','Riley Patel'][index],
                'company_name': f'DEMO - {company}', 'currency': 'USD',
                'billing_address': json.dumps({'street': f'{index+1} Demo Avenue', 'city': 'Demo City', 'state': '', 'postal_code': '00000', 'country': 'Demo'}),
                'notes': 'Synthetic hackathon demonstration record. No real customer or payment details.',
                'status': 'lead' if index == 5 else 'active'})
            customers.append(customer)
        products = []
        for sku, name, price in [('DEMO-CORE','Team Workspace','99.00'),('DEMO-ANALYTICS','Analytics Suite','249.00'),('DEMO-SUPPORT','Priority Support','49.00')]:
            product, _ = Product.objects.get_or_create(sku=sku, defaults={'name': f'DEMO - {name}',
                'sales_price': Decimal(price), 'cost_price': Decimal('20.00'), 'tax': tax,
                'category': 'Software', 'description': 'Synthetic demonstration product.', 'notes': 'DEMO data'})
            products.append(product)
        ProductVariant.objects.get_or_create(sku='DEMO-CORE-ODOO', defaults={'product': products[0], 'name': 'Odoo brand', 'price_modifier': Decimal('560.00')})
        plans = []
        for code, name, product, frequency, price in [
            ('DEMO-STARTER-M','Starter Monthly',products[0],'monthly','99.00'),
            ('DEMO-GROWTH-M','Growth Monthly',products[1],'monthly','249.00'),
            ('DEMO-TEAM-Y','Team Annual',products[0],'yearly','990.00'),
            ('DEMO-SUPPORT-W','Support Weekly',products[2],'weekly','49.00')]:
            plan, _ = SubscriptionPlan.objects.get_or_create(code=code, defaults={'name': f'DEMO - {name}',
                'billing_frequency': frequency, 'price': Decimal(price), 'description': 'Demo offering with recurring billing.',
                'features': ['Customer portal','Automated invoices','Subscription controls'],
                'start_date': today-timedelta(days=180), 'can_pause': True, 'can_renew': True})
            PlanItem.objects.get_or_create(plan=plan, product=product, defaults={'quantity': 1, 'unit_price': Decimal(price)})
            plans.append(plan)
        for index, status in enumerate(['active','active','paused','active','closed']):
            plan = plans[index % len(plans)]
            subtotal = plan.price
            amount = (subtotal * Decimal('1.10')).quantize(Decimal('0.01'))
            subscription, created = Subscription.objects.get_or_create(subscription_number=f'DEMO-SUB-{index+1:03d}', defaults={
                'customer': customers[index], 'plan': plan, 'status': status,
                'start_date': today-timedelta(days=90), 'expiry_date': today+timedelta(days=275),
                'next_billing_date': today+timedelta(days=[2,5,10,7,30][index]),
                'billing_frequency': plan.billing_frequency, 'subtotal': subtotal, 'tax_rate': Decimal('10'),
                'tax_amount': amount-subtotal, 'total_amount': amount, 'auto_renew': index != 1,
                'pause_reason': 'DEMO: seasonal pause' if status=='paused' else '', 'notes': 'Synthetic showcase subscription.'})
            item = plan.items.first()
            SubscriptionLineItem.objects.get_or_create(subscription=subscription, product=item.product, defaults={'quantity': 1,'unit_price': subtotal,'tax_rate': Decimal('10')})
            if created:
                SubscriptionEvent.objects.create(subscription=subscription, from_status='draft', to_status=status, actor='Demo setup', reason='Synthetic showcase subscription')
        # Historical invoices produce a real revenue chart, plus paid, overdue, partial and draft examples.
        for index, days_ago in enumerate([150,120,90,60,35,20,5,0]):
            customer = customers[index % 5]
            subtotal = [Decimal('99'),Decimal('249'),Decimal('490')][index % 3]
            total = (subtotal * Decimal('1.10')).quantize(Decimal('0.01'))
            issue = today-timedelta(days=days_ago)
            invoice, created = Invoice.objects.get_or_create(invoice_number=f'DEMO-INV-{index+1:03d}', defaults={
                'customer': customer, 'issue_date': issue, 'due_date': issue+timedelta(days=15),
                'billing_period_start': issue, 'billing_period_end': issue+timedelta(days=29),
                'status': 'draft' if index==7 else 'confirmed', 'subtotal': subtotal, 'tax_rate': Decimal('10'),
                'tax_amount': total-subtotal, 'total_amount': total, 'balance_due': total,
                'notes': 'DEMO - synthetic invoice; no real money is owed.'})
            InvoiceLineItem.objects.get_or_create(invoice=invoice, description='DEMO subscription service', defaults={
                'quantity': 1, 'unit_price': subtotal, 'tax_rate': Decimal('10'), 'amount': subtotal})
            if created and index < 4:
                Payment.objects.create(payment_number=f'DEMO-PAY-{index+1:03d}', customer=customer, invoice=invoice,
                    amount=total, payment_date=issue+timedelta(days=3), payment_method='bank_transfer',
                    transaction_reference=f'DEMO-TRANSFER-{index+1}', notes='Synthetic payment record; no funds transferred.')
            if created and index==4:
                Payment.objects.create(payment_number='DEMO-PAY-005', customer=customer, invoice=invoice,
                    amount=Decimal('100.00'), payment_date=issue+timedelta(days=5), payment_method='upi',
                    transaction_reference='DEMO-PARTIAL', notes='Synthetic partial payment; no funds transferred.')
        for index, status in enumerate(['draft','sent','accepted']):
            plan=plans[index % len(plans)]
            q, created=Quotation.objects.get_or_create(quotation_number=f'DEMO-QUO-{index+1:03d}', defaults={
                'customer': customers[index], 'plan': plan, 'status': status, 'valid_until': today+timedelta(days=14),
                'tax_rate': Decimal('10'), 'notes': 'DEMO - ready for quotation lifecycle demonstration.'})
            if created:
                QuotationLineItem.objects.create(quotation=q,product=plan.items.first().product,quantity=1,unit_price=plan.price)
                q.calculate_totals()
        Discount.objects.get_or_create(code='DEMO-WELCOME10',defaults={'name':'DEMO - Welcome 10%',
            'discount_type':'percentage','value':Decimal('10'),'start_date':today,'end_date':today+timedelta(days=90),'usage_limit':100})
        Discount.objects.get_or_create(code='DEMO-SAVE25',defaults={'name':'DEMO - Save 25',
            'discount_type':'fixed','value':Decimal('25'),'minimum_purchase_amount':Decimal('100'),
            'start_date':today,'end_date':today+timedelta(days=60),'usage_limit':50})
        self.stdout.write(self.style.SUCCESS('DEMO showcase ready: 6 customers, 3 products, 4 plans, 5 subscriptions, 8 invoices, 5 payments, 3 quotations and 2 discounts. Existing accounts and records unchanged.'))
