from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import CustomUser, Customer, validate_password_complexity

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class CustomerSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'user', 'user_email', 'name', 'company_name', 'email',
            'phone', 'billing_address', 'tax_id', 'notes', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_password(self, value):
        try:
            validate_password_complexity(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages)
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        company_name = validated_data.get('company_name', '')

        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=CustomUser.Role.CUSTOMER,
        )

        customer_name = f"{first_name} {last_name}".strip() or email.split('@')[0]
        Customer.objects.create(
            user=user,
            email=email,
            name=customer_name,
            company_name=company_name or customer_name,
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

