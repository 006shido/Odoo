from rest_framework import serializers
from .models import Discount

class DiscountSerializer(serializers.ModelSerializer):
    specific_product_name = serializers.CharField(source='specific_product.name', read_only=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'code', 'discount_type', 'value', 'scope',
            'specific_product', 'specific_product_name', 'minimum_purchase_amount',
            'minimum_quantity', 'start_date', 'end_date', 'usage_limit',
            'times_used', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'times_used', 'created_at']
