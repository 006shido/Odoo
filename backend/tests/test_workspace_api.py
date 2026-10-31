from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.identity.models import Customer, CustomUser, WorkspaceAudit
from apps.catalogue.models import Product
from apps.plans.models import SubscriptionPlan
from apps.quotations.models import Quotation
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice
from apps.payments.models import Payment


class WorkspaceAPITests(TestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user('owner@example.test', 'Password@123', role='admin')
        self.customer_user = CustomUser.objects.create_user('customer@example.test', 'Password@123')
        self.customer = Customer.objects.create(user=self.customer_user, name='Customer', email='customer@example.test')
        self.other = Customer.objects.create(name='Other', email='other@example.test')
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def command(self, action, payload=None, expected=200):
        response = self.client.post('/api/v1/workspace/', {'action': action, 'payload': payload or {}}, format='json')
        self.assertEqual(response.status_code, expected, response.data)
        return response.data

    def catalogue(self):
        product = self.command('createProduct', {'data': {'name': 'Suite', 'code': 'SUITE',
            'default_price': '100.00', 'cost_price': '10.00', 'tax_rate': '10.00',
            'category': 'Software', 'description': 'Persisted description', 'variants': [
                {'sku': 'SUITE-PRO', 'name': 'Pro', 'price_modifier': '20.00'}]}})['id']
        plan = self.command('createPlan', {'data': {'name': 'Monthly', 'code': 'MONTH',
            'product_id': product, 'frequency': 'monthly', 'price': '100.00',
            'features': ['One workspace'], 'minimum_quantity': 1}})['id']
        return product, plan

    def quote(self):
        product, plan = self.catalogue()
        expiry = (timezone.now().date() + timedelta(days=14)).isoformat()
        quote = self.command('createQuotation', {'data': {'customer_id': str(self.customer.pk),
            'items': [{'product_id': product, 'plan_id': plan, 'quantity': 2, 'unit_price': '100.00'}],
            'expiry_date': expiry}})['id']
        return quote

    def test_complete_flow_persists_and_reconciles(self):
        quote = self.quote()
        q = Quotation.objects.get(pk=quote)
        self.assertEqual(q.total_amount, Decimal('220.00'))
        self.command('sendQuotation', {'id': quote})
        self.client.force_authenticate(self.customer_user)
        self.command('acceptQuotation', {'id': quote})
        self.client.force_authenticate(self.admin)
        subscription = self.command('convertQuotationToSubscription', {'id': quote})['id']
        self.command('convertQuotationToSubscription', {'id': quote}, 400)
        self.command('runBillingEngine')
        self.command('runBillingEngine')
        self.assertEqual(Invoice.objects.count(), 1)
        invoice = Invoice.objects.get(subscription_id=subscription)
        self.command('recordPayment', {'data': {'customer_id': str(self.customer.pk), 'amount': '100.00',
            'method': 'bank_transfer', 'reference': 'BANK-001', 'received_date': timezone.now().date().isoformat(),
            'allocations': [{'invoice_id': str(invoice.pk), 'amount': '100.00'}]}})
        invoice.refresh_from_db()
        self.assertEqual(invoice.balance_due, Decimal('120.00'))
        response = self.client.get('/api/v1/workspace/')
        self.assertEqual(response.data['invoices'][0]['status'], 'partially_paid')
        self.assertEqual(response.data['products'][0]['description'], 'Persisted description')
        self.assertEqual(response.data['plans'][0]['features'], ['One workspace'])
        self.assertTrue(WorkspaceAudit.objects.exists())
        # A new client/session sees the same database state, not browser storage.
        fresh = APIClient()
        fresh.force_authenticate(self.admin)
        self.assertEqual(fresh.get('/api/v1/workspace/').data['payments'][0]['amount'], '100.00')

    def test_customer_isolation_and_server_price(self):
        product, plan = self.catalogue()
        self.client.force_authenticate(self.customer_user)
        state = self.client.get('/api/v1/workspace/').data
        self.assertEqual([c['id'] for c in state['customers']], [str(self.customer.pk)])
        self.assertEqual(len(state['allUsers']), 1)
        payload = {'data': {'customer_id': str(self.other.pk), 'items': [
            {'product_id': product, 'plan_id': plan, 'quantity': 1, 'unit_price': '0.01'}],
            'expiry_date': timezone.now().date().isoformat()}}
        self.command('createQuotation', payload, 404)
        payload['data']['customer_id'] = str(self.customer.pk)
        qid = self.command('createQuotation', payload)['id']
        self.assertEqual(Quotation.objects.get(pk=qid).subtotal, Decimal('100.00'))
        self.command('runBillingEngine', expected=403)
        self.command('recordPayment', {'data': {}}, 403)
        self.command('createProduct', {'data': {}}, 403)
        other_quote = Quotation.objects.create(quotation_number='OTHER', customer=self.other,
            plan_id=plan, status='sent')
        self.command('acceptQuotation', {'id': str(other_quote.pk)}, 404)
        self.assertEqual(self.client.post('/api/v1/catalogue/products/', {}, format='json').status_code, 403)

    def test_validation_rolls_back_nested_writes(self):
        self.command('createProduct', {'data': {'name': 'Bad', 'code': 'BAD', 'default_price': '-1.00'}}, 400)
        self.assertFalse(Product.objects.filter(sku='BAD').exists())
        self.command('createProduct', {'data': {'name': 'Bad', 'code': 'BAD', 'default_price': '1.00',
            'variants': [{'name': 'Invalid', 'sku': '', 'price_modifier': '1'}]}}, 400)
        self.assertFalse(Product.objects.filter(sku='BAD').exists())

    def test_overpayment_and_cross_customer_payment_rejected(self):
        today = timezone.now().date()
        invoice = Invoice.objects.create(invoice_number='INV-1', customer=self.customer, issue_date=today,
            due_date=today, status='confirmed', total_amount='50.00', balance_due='50.00')
        payload = {'data': {'customer_id': str(self.customer.pk), 'amount': '60.00', 'method': 'cash',
            'received_date': today.isoformat(), 'allocations': [{'invoice_id': str(invoice.pk), 'amount': '60.00'}]}}
        self.command('recordPayment', payload, 400)
        self.assertFalse(Payment.objects.exists())
        invoice.refresh_from_db()
        self.assertEqual(invoice.balance_due, Decimal('50.00'))
        payload['data']['customer_id'] = str(self.other.pk)
        self.command('recordPayment', payload, 400)

    def test_settings_and_lifecycle_are_persistent(self):
        self.command('updateSettings', {'data': {'company_name': 'Updated company'}})
        self.assertEqual(self.client.get('/api/v1/workspace/').data['settings']['company_name'], 'Updated company')
        quote = self.quote()
        self.command('sendQuotation', {'id': quote})
        self.command('acceptQuotation', {'id': quote})
        sid = self.command('convertQuotationToSubscription', {'id': quote})['id']
        self.command('pauseSubscription', {'id': sid, 'reason': 'Vacation'})
        self.assertEqual(Subscription.objects.get(pk=sid).status, 'paused')
        self.command('resumeSubscription', {'id': sid})
        self.command('setSubscriptionAutoRenew', {'id': sid, 'enabled': False})
        self.assertFalse(Subscription.objects.get(pk=sid).auto_renew)

    def test_session_login_requires_csrf_and_logout_revokes_session(self):
        client = APIClient(enforce_csrf_checks=True)
        credentials = {'email': self.customer_user.email, 'password': 'Password@123'}
        self.assertEqual(client.post('/api/v1/auth/login/', credentials, format='json').status_code, 403)
        token = client.get('/api/v1/auth/csrf/').data['csrfToken']
        self.assertEqual(client.post('/api/v1/auth/login/', credentials, format='json', HTTP_X_CSRFTOKEN=token).status_code, 200)
        self.assertEqual(client.get('/api/v1/workspace/').status_code, 200)
        token = client.cookies['csrftoken'].value
        self.assertEqual(client.post('/api/v1/auth/logout/', {}, format='json', HTTP_X_CSRFTOKEN=token).status_code, 200)
        self.assertEqual(client.get('/api/v1/workspace/').status_code, 403)

    def test_anonymous_access_cannot_create_records(self):
        self.client.force_authenticate(None)
        self.command('createCustomer', {'data': {'name': 'No', 'email': 'no@example.test'}}, 403)
        self.assertEqual(self.client.get('/api/v1/workspace/').status_code, 403)
