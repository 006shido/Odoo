from rest_framework import viewsets
from .models import Tax, Product, ProductVariant
from .serializers import TaxSerializer, ProductSerializer, ProductVariantSerializer

class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all().order_by('-created_at')
    serializer_class = TaxSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('variants', 'tax').order_by('-created_at')
    serializer_class = ProductSerializer

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all().select_related('product').order_by('-created_at')
    serializer_class = ProductVariantSerializer
