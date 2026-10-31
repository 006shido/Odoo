from apps.identity.workspace import workspace_view
from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'healthy',
        'service': 'Brightloop Subscription Management Engine',
        'version': '1.0.0',
    })

urlpatterns = [
    path('api/v1/workspace/', workspace_view, name='workspace'),
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/auth/', include('apps.identity.urls')),
    path('api/v1/catalogue/', include('apps.catalogue.urls')),
    path('api/v1/plans/', include('apps.plans.urls')),
    path('api/v1/quotations/', include('apps.quotations.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/discounts/', include('apps.discounts.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]

