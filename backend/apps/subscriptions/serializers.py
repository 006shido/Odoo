from rest_framework import serializers
from .models import Subscription, SubscriptionLineItem, SubscriptionEvent

class SubscriptionLineItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SubscriptionLineItem
        fields = ['id', 'subscription', 'product', 'product_name', 'variant', 'variant_name', 'quantity', 'unit_price', 'tax_rate', 'total_price']
        read_only_fields = ['id', 'total_price']

class SubscriptionEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionEvent
        fields = ['id', 'from_status', 'to_status', 'actor', 'reason', 'timestamp']

class SubscriptionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_company = serializers.CharField(source='customer.company_name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    can_pause = serializers.BooleanField(source='plan.can_pause', read_only=True)
    can_close_early = serializers.BooleanField(source='plan.can_close_early', read_only=True)
    can_renew = serializers.BooleanField(source='plan.can_renew', read_only=True)
    line_items = SubscriptionLineItemSerializer(many=True, read_only=True)
    events = SubscriptionEventSerializer(many=True, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'subscription_number', 'customer', 'customer_name', 'customer_company',
            'plan', 'plan_name', 'source_quotation', 'status', 'start_date', 'expiry_date',
            'next_billing_date', 'billing_frequency', 'payment_terms', 'subtotal',
            'tax_rate', 'tax_amount', 'total_amount', 'paused_at', 'pause_reason',
            'closed_at', 'close_reason', 'can_pause', 'can_close_early', 'can_renew',
            'notes', 'line_items', 'events', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subscription_number', 'created_at', 'updated_at']

