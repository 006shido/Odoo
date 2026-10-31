from rest_framework import serializers
from .models import SubscriptionPlan, PlanItem
from apps.catalogue.serializers import ProductSerializer, ProductVariantSerializer

class PlanItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)

    class Meta:
        model = PlanItem
        fields = ['id', 'plan', 'product', 'product_name', 'variant', 'variant_name', 'quantity', 'unit_price']
        read_only_fields = ['id']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    items = PlanItemSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'code', 'description', 'billing_frequency', 'price',
            'minimum_quantity', 'start_date', 'end_date', 'auto_close_on_expiry',
            'can_close_early', 'can_pause', 'can_renew', 'is_active', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

