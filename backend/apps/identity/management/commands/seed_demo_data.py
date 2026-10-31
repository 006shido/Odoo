from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.identity.models import CustomUser, Customer
from apps.catalogue.models import Tax, Product, ProductVariant
from apps.plans.models import SubscriptionPlan, PlanItem
from apps.quotations.models import Quotation, QuotationLineItem
from apps.subscriptions.models import Subscription, SubscriptionLineItem, SubscriptionEvent
from apps.billing.models import Invoice, InvoiceLineItem
from apps.payments.models import Payment
from apps.discounts.models import Discount

class Command(BaseCommand):
    help = 'Seeds complete demonstration data matching Brightloop problem statement scenes.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Brightloop database with comprehensive demo records...')

        # 1. Taxes
        gst_tax, _ = Tax.objects.get_or_create(
            name="GST Standard",
            defaults={'rate': Decimal('18.00'), 'is_default': True}
        )

        # 2. Users & Roles
        # Admin
        admin_user, created = CustomUser.objects.get_or_create(
            email='admin@brightloop.io',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Connor',
                'role': CustomUser.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('Brightloop@2026')
        admin_user.save()

        # Staff
        staff_user, _ = CustomUser.objects.get_or_create(
            email='staff@brightloop.io',
            defaults={
                'first_name': 'David',
                'last_name': 'Miller',
                'role': CustomUser.Role.STAFF,
                'is_staff': True,
            }
        )
        staff_user.set_password('Brightloop@2026')
        staff_user.save()

        # Customer User
        customer_user, _ = CustomUser.objects.get_or_create(
            email='alex@acmecorp.com',
            defaults={
                'first_name': 'Alex',
                'last_name': 'Rivera',
                'role': CustomUser.Role.CUSTOMER,
            }
        )
        customer_user.set_password('Brightloop@2026')
        customer_user.save()

        # 3. Customer Profiles
        acme_customer, _ = Customer.objects.get_or_create(
            email='alex@acmecorp.com',
            defaults={
                'user': customer_user,
                'name': 'Alex Rivera',
                'company_name': 'Acme Corporation',
                'phone': '+91 98765 43210',
                'billing_address': '42 Cyber City, Tower B, Sector 24, Gurugram, India',
                'tax_id': '07AAAAA0000A1Z5',
            }
        )

        zen_customer, _ = Customer.objects.get_or_create(
            email='vikram@zenretail.com',
            defaults={
                'name': 'Vikram Rao',
                'company_name': 'Zen Retail Store',
                'phone': '+91 91234 56789',
                'billing_address': '18 MG Road, Bengaluru, Karnataka, India',
                'tax_id': '29BBBBB1111B2Z6',
            }
        )

        # 4. Products & Variants (from problem statement: Odoo brand adds 560)
        core_software, _ = Product.objects.get_or_create(
            sku='PROD-CORE-001',
            defaults={
                'name': 'Brightloop Core Business Software',
                'product_type': Product.ProductType.SOFTWARE,
                'sales_price': Decimal('2500.00'),
                'cost_price': Decimal('800.00'),
                'tax': gst_tax,
                'notes': 'Flagship multi-module cloud subscription suite',
            }
        )

        odoo_variant, _ = ProductVariant.objects.get_or_create(
            sku='VAR-BRAND-ODOO',
            defaults={
                'product': core_software,
                'name': 'Brand: Odoo Edition',
                'price_modifier': Decimal('560.00'),
            }
        )

        addon_product, _ = Product.objects.get_or_create(
            sku='PROD-ADDON-STORAGE',
            defaults={
                'name': 'High-Speed Cloud Storage (500GB)',
                'product_type': Product.ProductType.ADDON,
                'sales_price': Decimal('499.00'),
                'cost_price': Decimal('150.00'),
                'tax': gst_tax,
                'notes': 'Customer on/off toggle storage add-on',
            }
        )

        # 5. Plans (Scene 2)
        monthly_plan, _ = SubscriptionPlan.objects.get_or_create(
            code='PLAN-MONTHLY-BIZ',
            defaults={
                'name': 'Business Professional Monthly',
                'billing_frequency': SubscriptionPlan.BillingFrequency.MONTHLY,
                'price': Decimal('3060.00'),
                'minimum_quantity': 1,
                'auto_close_on_expiry': False,
                'can_close_early': True,
                'can_pause': True,
                'can_renew': True,
            }
        )
        PlanItem.objects.get_or_create(
            plan=monthly_plan,
            product=core_software,
            variant=odoo_variant,
            defaults={'quantity': 1, 'unit_price': Decimal('3060.00')}
        )

        yearly_plan, _ = SubscriptionPlan.objects.get_or_create(
            code='PLAN-YEARLY-ENT',
            defaults={
                'name': 'Enterprise Yearly Contract',
                'billing_frequency': SubscriptionPlan.BillingFrequency.YEARLY,
                'price': Decimal('32000.00'),
                'minimum_quantity': 5,
                'auto_close_on_expiry': True,
                'can_close_early': True,
                'can_pause': False,
                'can_renew': True,
            }
        )

        # 6. Discounts (Scene 5)
        volume_discount, _ = Discount.objects.get_or_create(
            code='VOLUME10',
            defaults={
                'name': 'Volume Seat Discount 10%',
                'discount_type': Discount.DiscountType.PERCENTAGE,
                'value': Decimal('10.00'),
                'scope': Discount.Scope.SUBSCRIPTION,
                'minimum_purchase_amount': Decimal('2000.00'),
                'usage_limit': 50,
            }
        )

        # 7. Subscriptions (Scene 3)
        today = timezone.now().date()
        active_sub, _ = Subscription.objects.get_or_create(
            subscription_number='SUB-2026-0001',
            defaults={
                'customer': acme_customer,
                'plan': monthly_plan,
                'status': Subscription.Status.ACTIVE,
                'start_date': today - timedelta(days=60),
                'expiry_date': today + timedelta(days=305),
                'next_billing_date': today,
                'billing_frequency': 'monthly',
                'payment_terms': 'Net 15',
                'subtotal': Decimal('3060.00'),
                'tax_rate': Decimal('18.00'),
                'tax_amount': Decimal('550.80'),
                'total_amount': Decimal('3610.80'),
                'notes': 'Active high-value customer subscription',
            }
        )
        SubscriptionLineItem.objects.get_or_create(
            subscription=active_sub,
            product=core_software,
            variant=odoo_variant,
            defaults={'quantity': 1, 'unit_price': Decimal('3060.00'), 'tax_rate': Decimal('18.00')}
        )

        paused_sub, _ = Subscription.objects.get_or_create(
            subscription_number='SUB-2026-0002',
            defaults={
                'customer': zen_customer,
                'plan': monthly_plan,
                'status': Subscription.Status.PAUSED,
                'start_date': today - timedelta(days=90),
                'expiry_date': today + timedelta(days=275),
                'next_billing_date': today + timedelta(days=15),
                'billing_frequency': 'monthly',
                'payment_terms': 'Net 15',
                'subtotal': Decimal('3060.00'),
                'tax_rate': Decimal('18.00'),
                'tax_amount': Decimal('550.80'),
                'total_amount': Decimal('3610.80'),
                'paused_at': timezone.now() - timedelta(days=10),
                'pause_reason': 'Store renovation until middle of next month',
            }
        )

        # 8. Invoices & Payments (Scene 4 & Scene 6)
        # Paid invoice from last month
        paid_inv, _ = Invoice.objects.get_or_create(
            invoice_number='INV-2026-00001',
            defaults={
                'customer': acme_customer,
                'subscription': active_sub,
                'issue_date': today - timedelta(days=30),
                'due_date': today - timedelta(days=15),
                'billing_period_start': today - timedelta(days=30),
                'billing_period_end': today - timedelta(days=1),
                'status': Invoice.Status.PAID,
                'subtotal': Decimal('3060.00'),
                'tax_rate': Decimal('18.00'),
                'tax_amount': Decimal('550.80'),
                'total_amount': Decimal('3610.80'),
                'paid_amount': Decimal('3610.80'),
                'balance_due': Decimal('0.00'),
                'notes': 'Paid in full via Bank Wire',
            }
        )
        InvoiceLineItem.objects.get_or_create(
            invoice=paid_inv,
            description='Brightloop Core Business Software (Brand: Odoo)',
            defaults={'quantity': 1, 'unit_price': Decimal('3060.00'), 'tax_rate': Decimal('18.00'), 'amount': Decimal('3060.00')}
        )
        Payment.objects.get_or_create(
            payment_number='PAY-2026-00001',
            defaults={
                'customer': acme_customer,
                'invoice': paid_inv,
                'amount': Decimal('3610.80'),
                'payment_date': today - timedelta(days=20),
                'payment_method': Payment.PaymentMethod.BANK_TRANSFER,
                'transaction_reference': 'HDFC9823487123',
                'notes': 'Full settlement received',
            }
        )

        # Overdue invoice for Zen Retail
        overdue_inv, _ = Invoice.objects.get_or_create(
            invoice_number='INV-2026-00002',
            defaults={
                'customer': zen_customer,
                'subscription': paused_sub,
                'issue_date': today - timedelta(days=40),
                'due_date': today - timedelta(days=25),
                'billing_period_start': today - timedelta(days=40),
                'billing_period_end': today - timedelta(days=11),
                'status': Invoice.Status.CONFIRMED,
                'subtotal': Decimal('3060.00'),
                'tax_rate': Decimal('18.00'),
                'tax_amount': Decimal('550.80'),
                'total_amount': Decimal('3610.80'),
                'paid_amount': Decimal('1500.00'),  # Partial payment!
                'balance_due': Decimal('2110.80'),
                'notes': 'Partial payment received; remaining balance overdue',
            }
        )
        Payment.objects.get_or_create(
            payment_number='PAY-2026-00002',
            defaults={
                'customer': zen_customer,
                'invoice': overdue_inv,
                'amount': Decimal('1500.00'),
                'payment_date': today - timedelta(days=22),
                'payment_method': Payment.PaymentMethod.UPI,
                'transaction_reference': 'UPI-REF-992384',
                'notes': 'Initial partial installment',
            }
        )

        # 9. Quotations (Scene 3)
        quote_1, _ = Quotation.objects.get_or_create(
            quotation_number='QT-2026-0001',
            defaults={
                'customer': acme_customer,
                'plan': yearly_plan,
                'status': Quotation.Status.SENT,
                'valid_until': today + timedelta(days=14),
                'payment_terms': 'Net 30',
                'subtotal': Decimal('32000.00'),
                'tax_rate': Decimal('18.00'),
                'tax_amount': Decimal('5760.00'),
                'total_amount': Decimal('37760.00'),
                'notes': 'Proposal for expanding to enterprise annual tier',
            }
        )
        QuotationLineItem.objects.get_or_create(
            quotation=quote_1,
            product=core_software,
            variant=odoo_variant,
            defaults={'quantity': 5, 'unit_price': Decimal('6400.00')}
        )

        self.stdout.write(self.style.SUCCESS(
            'Demo data seeded successfully!\n'
            'Admin: admin@brightloop.io / Brightloop@2026\n'
            'Staff: staff@brightloop.io / Brightloop@2026\n'
            'Customer: alex@acmecorp.com / Brightloop@2026'
        ))

