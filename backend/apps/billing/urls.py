from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, BillingRunViewSet, trigger_billing_run

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'runs', BillingRunViewSet, basename='billing-run')

urlpatterns = [
    path('run/', trigger_billing_run, name='trigger-billing-run'),
    path('', include(router.urls)),
]

