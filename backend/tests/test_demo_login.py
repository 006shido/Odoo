from django.test import TestCase, override_settings
from django.core.management import call_command
from rest_framework.test import APIClient
from apps.identity.models import CustomUser


class LocalDemoLoginTests(TestCase):
    def setUp(self):
        call_command('setup_demo_logins', verbosity=0)
        self.client=APIClient(enforce_csrf_checks=True)

    @override_settings(ENABLE_LOCAL_DEMO_LOGIN=False, DEBUG=True)
    def test_disabled_by_default(self):
        self.assertFalse(self.client.get('/api/v1/auth/demo-login/',HTTP_HOST='localhost').data['enabled'])
        self.assertEqual(self.client.post('/api/v1/auth/demo-login/',{'role':'admin'},format='json',HTTP_HOST='localhost').status_code,404)

    @override_settings(ENABLE_LOCAL_DEMO_LOGIN=True, DEBUG=False)
    def test_never_enabled_in_production(self):
        self.assertEqual(self.client.post('/api/v1/auth/demo-login/',{'role':'admin'},format='json',HTTP_HOST='localhost').status_code,404)

    @override_settings(ENABLE_LOCAL_DEMO_LOGIN=True, DEBUG=True)
    def test_each_role_uses_real_session_with_csrf(self):
        self.assertEqual(self.client.post('/api/v1/auth/demo-login/',{'role':'admin'},format='json',HTTP_HOST='localhost').status_code,403)
        for role in ('admin','staff','customer'):
            token=self.client.get('/api/v1/auth/csrf/',HTTP_HOST='localhost').data['csrfToken']
            response=self.client.post('/api/v1/auth/demo-login/',{'role':role},format='json',HTTP_HOST='localhost',HTTP_X_CSRFTOKEN=token)
            self.assertEqual(response.status_code,200,response.data)
            self.assertEqual(response.data['user']['role'],role)
            self.assertEqual(self.client.get('/api/v1/auth/me/').data['user']['role'],role)
        self.assertTrue(all(not u.has_usable_password() for u in CustomUser.objects.all()))
        token=self.client.cookies['csrftoken'].value
        self.assertEqual(self.client.post('/api/v1/auth/demo-login/',{'role':'admin'},format='json',HTTP_HOST='public.example',HTTP_X_CSRFTOKEN=token).status_code,404)

    @override_settings(ENABLE_LOCAL_DEMO_LOGIN=True, DEBUG=True)
    def test_demo_checkout_is_persisted_and_real_customers_are_denied(self):
        from apps.plans.models import SubscriptionPlan
        from apps.billing.models import Invoice
        from apps.identity.models import Customer
        call_command('seed_showcase', verbosity=0)
        user=CustomUser.objects.get(email='demo-login-customer@example.invalid')
        customer=Customer.objects.get(user=user)
        client=APIClient(); client.force_authenticate(user)
        payload={'action':'purchasePlan','payload':{'data':{'customer_id':str(customer.pk),'plan_id':str(SubscriptionPlan.objects.first().pk),'method':'upi','reference':'DEMO-CHECKOUT'}}}
        response=client.post('/api/v1/workspace/',payload,format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(Invoice.objects.get(subscription_id=response.data['id']).status,'paid')
        real=CustomUser.objects.create_user('real@example.test','Password@123')
        client.force_authenticate(real)
        self.assertEqual(client.post('/api/v1/workspace/',payload,format='json').status_code,403)
