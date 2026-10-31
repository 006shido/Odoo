from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_company = serializers.CharField(source='customer.company_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'customer', 'customer_name', 'customer_company',
            'invoice', 'invoice_number', 'amount', 'payment_date', 'payment_method',
            'transaction_reference', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at']

