from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, PlanItemViewSet

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')
router.register(r'items', PlanItemViewSet, basename='plan-item')

urlpatterns = [
    path('', include(router.urls)),
]
