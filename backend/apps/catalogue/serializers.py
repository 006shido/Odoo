from rest_framework import serializers
from .models import Tax, Product, ProductVariant

class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = ['id', 'name', 'rate', 'is_default', 'is_active', 'created_at']

class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'name', 'sku', 'price_modifier', 'effective_price', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    tax_rate = serializers.DecimalField(source='tax.rate', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'product_type', 'sales_price', 'cost_price',
            'tax', 'tax_rate', 'notes', 'is_active', 'variants', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

