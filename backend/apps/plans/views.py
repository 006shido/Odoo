from rest_framework import viewsets
from .models import SubscriptionPlan, PlanItem
from .serializers import SubscriptionPlanSerializer, PlanItemSerializer

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all().prefetch_related('items__product', 'items__variant').order_by('-created_at')
    serializer_class = SubscriptionPlanSerializer

class PlanItemViewSet(viewsets.ModelViewSet):
    queryset = PlanItem.objects.all().select_related('product', 'variant')
    serializer_class = PlanItemSerializer

