from django.core.management import call_command
from django.test import TestCase
from apps.identity.models import CustomUser, Customer
from apps.billing.models import Invoice
from apps.payments.models import Payment
from apps.identity.workspace import snapshot


class ShowcaseSeedTests(TestCase):
    def test_rerun_is_idempotent_and_preserves_accounts(self):
        admin=CustomUser.objects.create_user('owner@example.test','OwnerPassword@123',role='admin')
        old_password=admin.password
        call_command('seed_showcase',verbosity=0)
        call_command('seed_showcase',verbosity=0)
        self.assertEqual(Customer.objects.count(),6)
        self.assertEqual(Invoice.objects.count(),8)
        self.assertEqual(Payment.objects.count(),5)
        admin.refresh_from_db()
        self.assertEqual(admin.password,old_password)
        self.assertEqual(CustomUser.objects.count(),1)
        state=snapshot(admin)
        self.assertTrue(any(i['status']=='paid' for i in state['invoices']))
        self.assertTrue(any(i['status']=='partially_paid' for i in state['invoices']))
        self.assertTrue(any(i['is_overdue'] for i in state['invoices']))
        self.assertTrue(any(s['status']=='paused' for s in state['subscriptions']))
        self.assertGreater(float(state['metrics']['mrr']),0)
