from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxViewSet, ProductViewSet, ProductVariantViewSet

router = DefaultRouter()
router.register(r'taxes', TaxViewSet, basename='tax')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'variants', ProductVariantViewSet, basename='variant')

urlpatterns = [
    path('', include(router.urls)),
]
