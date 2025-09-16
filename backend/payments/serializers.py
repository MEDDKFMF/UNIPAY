from rest_framework import serializers
from .models import Payment, Plan, Subscription, UserPaymentMethod, ClientPaymentMethod, PlatformPaymentGateway
from invoices.serializers import InvoiceSerializer


class UserPaymentMethodSerializer(serializers.ModelSerializer):
    """
    Serializer for user payment receiving methods.
    """
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserPaymentMethod
        fields = [
            'id', 'payment_type', 'bank_name', 'bank_account_number', 'bank_account_name',
            'bank_swift_code', 'bank_branch_code', 'mpesa_phone_number', 'mpesa_account_name',
            'card_last_four', 'card_brand', 'card_expiry', 'payment_details',
            'is_primary', 'is_active', 'display_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'display_name']
    
    def get_display_name(self, obj):
        """Get display name for the payment method"""
        return str(obj)
    
    def validate_mpesa_phone_number(self, value):
        """Validate M-Pesa phone number format"""
        if value and not value.startswith('254'):
            raise serializers.ValidationError("M-Pesa phone number must start with '254'")
        return value


class UserPaymentMethodCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating user payment methods.
    """
    class Meta:
        model = UserPaymentMethod
        fields = [
            'payment_type', 'bank_name', 'bank_account_number', 'bank_account_name',
            'bank_swift_code', 'bank_branch_code', 'mpesa_phone_number', 'mpesa_account_name',
            'card_last_four', 'card_brand', 'card_expiry', 'payment_details',
            'is_primary', 'is_active'
        ]
    
    def validate(self, data):
        """Validate payment method data based on type"""
        payment_type = data.get('payment_type')
        
        if payment_type == 'bank_account':
            required_fields = ['bank_name', 'bank_account_number', 'bank_account_name']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(f"{field} is required for bank account")
        
        elif payment_type == 'mpesa':
            if not data.get('mpesa_phone_number'):
                raise serializers.ValidationError("M-Pesa phone number is required")
        
        elif payment_type == 'card':
            required_fields = ['card_last_four', 'card_brand', 'card_expiry']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(f"{field} is required for card")
        
        return data


class ClientPaymentMethodSerializer(serializers.ModelSerializer):
    """
    Serializer for client payment methods (for recurring payments).
    """
    client_name = serializers.CharField(source='client.name', read_only=True)
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientPaymentMethod
        fields = [
            'id', 'client', 'client_name', 'payment_type', 'card_last_four', 'card_brand',
            'card_expiry', 'card_holder_name', 'bank_name', 'bank_account_number',
            'bank_account_name', 'mpesa_phone_number', 'payment_details',
            'is_recurring_enabled', 'recurring_frequency', 'is_active',
            'display_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'client_name', 'display_name', 'created_at', 'updated_at']
    
    def get_display_name(self, obj):
        """Get display name for the payment method"""
        return str(obj)


class PlatformPaymentGatewaySerializer(serializers.ModelSerializer):
    """
    Serializer for platform payment gateways (admin only).
    """
    class Meta:
        model = PlatformPaymentGateway
        fields = [
            'id', 'name', 'environment', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for payment management.
    """
    invoice = InvoiceSerializer(read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    client_name = serializers.SerializerMethodField()
    payment_date = serializers.DateTimeField(source='created_at', read_only=True)
    reference = serializers.CharField(source='transaction_id', read_only=True)
    
    def get_client_name(self, obj):
        """Safely get client name"""
        try:
            return obj.invoice.client.name if obj.invoice and obj.invoice.client else 'N/A'
        except:
            return 'N/A'
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_number', 'client_name', 'amount', 'currency',
            'payment_method', 'status', 'transaction_id', 'payment_intent_id',
            'gateway_session_id', 'metadata', 'error_message', 'created_at', 'updated_at',
            'completed_at', 'payment_date', 'reference'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'payment_intent_id', 'gateway_session_id',
            'metadata', 'error_message', 'created_at', 'updated_at', 'completed_at',
            'invoice_number', 'client_name', 'payment_date', 'reference'
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating payments.
    """
    class Meta:
        model = Payment
        fields = [
            'invoice', 'amount', 'currency', 'payment_method', 'status',
            'transaction_id', 'error_message'
        ]
    
    def validate_invoice(self, value):
        """Validate that invoice exists and belongs to user"""
        if value.status == 'paid':
            raise serializers.ValidationError("Invoice is already paid.")
        return value
    
    def validate_amount(self, value):
        """Validate payment amount"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than 0.")
        return value


class CreateCheckoutSessionSerializer(serializers.Serializer):
    """
    Serializer for creating checkout sessions.
    """
    invoice_id = serializers.IntegerField()
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()
    payment_method = serializers.ChoiceField(
        choices=['stripe', 'flutterwave', 'mpesa'],
        default='stripe'
    )


class PaymentWebhookSerializer(serializers.Serializer):
    """
    Serializer for payment webhook data.
    """
    payment_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['completed', 'failed', 'cancelled'])
    transaction_id = serializers.CharField(required=False)
    error_message = serializers.CharField(required=False)


class PlanSerializer(serializers.ModelSerializer):
    """
    Serializer for subscription plans.
    """
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'price', 'currency', 'billing_cycle',
            'features', 'is_active', 'created_at', 'updated_at'
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for user subscriptions.
    """
    plan = PlanSerializer(read_only=True)
    plan_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'plan', 'plan_id', 'status', 'start_date', 'end_date',
            'auto_renew', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']