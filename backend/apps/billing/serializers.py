from rest_framework import serializers
from .models import Invoice, InvoiceLineItem, BillingRun

class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'tax_rate', 'amount']

class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_company = serializers.CharField(source='customer.company_name', read_only=True)
    subscription_number = serializers.CharField(source='subscription.subscription_number', read_only=True)
    discount_name = serializers.CharField(source='applied_discount.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'customer_company',
            'subscription', 'subscription_number', 'applied_discount', 'discount_name',
            'issue_date', 'due_date', 'billing_period_start', 'billing_period_end',
            'status', 'subtotal', 'tax_rate', 'tax_amount', 'discount_amount',
            'total_amount', 'paid_amount', 'balance_due', 'is_overdue', 'notes',
            'line_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']

class BillingRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingRun
        fields = '__all__'

