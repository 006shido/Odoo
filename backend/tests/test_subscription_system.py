from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from apps.identity.models import CustomUser, Customer
from apps.catalogue.models import Product, ProductVariant, Tax
from apps.plans.models import SubscriptionPlan, PlanItem
from apps.quotations.models import Quotation, QuotationLineItem
from apps.subscriptions.models import Subscription, SubscriptionLineItem
from apps.billing.models import Invoice
from apps.billing.engine import run_billing_for_date
from apps.payments.models import Payment

class SubscriptionSystemTestCase(TestCase):
    def setUp(self):
        self.tax = Tax.objects.create(name="GST 18%", rate=Decimal('18.00'), is_default=True)
        self.product = Product.objects.create(
            name="Business Suite",
            sku="BIZ-01",
            sales_price=Decimal('2000.00'),
            tax=self.tax
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name="Brand: Odoo",
            sku="BIZ-01-ODOO",
            price_modifier=Decimal('560.00')
        )
        self.plan = SubscriptionPlan.objects.create(
            name="Monthly Plan",
            code="PLAN-M",
            price=Decimal('2560.00'),
            billing_frequency='monthly'
        )
        self.customer = Customer.objects.create(
            name="Test Customer",
            email="test@customer.com",
            company_name="Test Co"
        )

    def test_variant_pricing(self):
        self.assertEqual(self.variant.effective_price, Decimal('2560.00'))

    def test_quotation_conversion_and_idempotency(self):
        quote = Quotation.objects.create(
            quotation_number="QT-TEST-001",
            customer=self.customer,
            plan=self.plan,
            subtotal=Decimal('2560.00'),
            tax_rate=Decimal('18.00'),
            tax_amount=Decimal('460.80'),
            total_amount=Decimal('3020.80'),
            status=Quotation.Status.ACCEPTED
        )
        QuotationLineItem.objects.create(
            quotation=quote,
            product=self.product,
            variant=self.variant,
            quantity=1,
            unit_price=Decimal('2560.00')
        )

        from rest_framework.test import APIRequestFactory
        from apps.quotations.views import QuotationViewSet

        factory = APIRequestFactory()
        view = QuotationViewSet.as_view({'post': 'convert_to_subscription'})
        request = factory.post('/api/v1/quotations/quotations/convert_to_subscription/')
        request.user = CustomUser.objects.create_user(email="staff_test@brightloop.io", password="Password@123", role="staff")

        response = view(request, pk=str(quote.id))
        self.assertEqual(response.status_code, 200)

        quote.refresh_from_db()
        self.assertEqual(quote.status, Quotation.Status.CONVERTED)
        self.assertEqual(Subscription.objects.count(), 1)

        # Attempt duplicate conversion
        dup_response = view(request, pk=str(quote.id))
        self.assertEqual(dup_response.status_code, 400)
        self.assertEqual(Subscription.objects.count(), 1)

    def test_recurring_billing_idempotency(self):
        today = timezone.now().date()
        sub = Subscription.objects.create(
            subscription_number="SUB-TEST-001",
            customer=self.customer,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
            start_date=today,
            next_billing_date=today,
            billing_frequency='monthly',
            subtotal=Decimal('2560.00'),
            tax_rate=Decimal('18.00'),
            tax_amount=Decimal('460.80'),
            total_amount=Decimal('3020.80'),
        )
        SubscriptionLineItem.objects.create(
            subscription=sub,
            product=self.product,
            variant=self.variant,
            quantity=1,
            unit_price=Decimal('2560.00'),
            tax_rate=Decimal('18.00')
        )

        # Run 1: Should create 1 invoice
        run1 = run_billing_for_date(today)
        self.assertEqual(run1.invoices_created, 1)
        self.assertEqual(Invoice.objects.count(), 1)

        # Run 2: Retry immediately -> Should skip
        run2 = run_billing_for_date(today)
        self.assertEqual(run2.invoices_created, 0)
        self.assertEqual(Invoice.objects.count(), 1)

    def test_payment_and_partial_balance(self):
        today = timezone.now().date()
        inv = Invoice.objects.create(
            invoice_number="INV-TEST-001",
            customer=self.customer,
            issue_date=today,
            due_date=today + timedelta(days=15),
            status=Invoice.Status.CONFIRMED,
            total_amount=Decimal('1000.00'),
            paid_amount=Decimal('0.00'),
            balance_due=Decimal('1000.00')
        )

        # Partial payment ₹400
        pay1 = Payment.objects.create(
            payment_number="PAY-TEST-001",
            customer=self.customer,
            invoice=inv,
            amount=Decimal('400.00'),
            payment_date=today,
            payment_method=Payment.PaymentMethod.BANK_TRANSFER
        )
        inv.refresh_from_db()
        self.assertEqual(inv.paid_amount, Decimal('400.00'))
        self.assertEqual(inv.balance_due, Decimal('600.00'))
        self.assertEqual(inv.status, Invoice.Status.CONFIRMED)

        # Final settlement payment ₹600
        pay2 = Payment.objects.create(
            payment_number="PAY-TEST-002",
            customer=self.customer,
            invoice=inv,
            amount=Decimal('600.00'),
            payment_date=today,
            payment_method=Payment.PaymentMethod.UPI
        )
        inv.refresh_from_db()
        self.assertEqual(inv.paid_amount, Decimal('1000.00'))
        self.assertEqual(inv.balance_due, Decimal('0.00'))
        self.assertEqual(inv.status, Invoice.Status.PAID)

