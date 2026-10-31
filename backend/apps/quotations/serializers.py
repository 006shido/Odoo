from rest_framework import serializers
from .models import Quotation, QuotationLineItem
from apps.catalogue.serializers import ProductSerializer, ProductVariantSerializer

class QuotationLineItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = QuotationLineItem
        fields = ['id', 'quotation', 'product', 'product_name', 'variant', 'variant_name', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['id', 'total_price']

class QuotationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_company = serializers.CharField(source='customer.company_name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    line_items = QuotationLineItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_number', 'customer', 'customer_name', 'customer_company',
            'plan', 'plan_name', 'status', 'valid_until', 'payment_terms',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'total_amount',
            'notes', 'line_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quotation_number', 'created_at', 'updated_at']
