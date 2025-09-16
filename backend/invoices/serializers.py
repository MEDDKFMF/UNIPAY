"""
Serializers for invoice and invoice item management.
"""

from rest_framework import serializers
from .models import Invoice, InvoiceItem
from accounts.models import Client, User


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total_price']


class InvoiceCreateSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    currency_symbol = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'currency', 'exchange_rate',
            'issue_date', 'due_date', 'status', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'notes', 'terms_conditions',
            'items', 'currency_symbol', 'formatted_total', 'created_at'
        ]
        read_only_fields = ['invoice_number', 'created_at']
    
    def get_currency_symbol(self, obj):
        return obj.get_currency_symbol()
    
    def get_formatted_total(self, obj):
        return obj.get_formatted_total()
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        invoice.calculate_totals()
        invoice.save()
        return invoice


class InvoiceUpdateSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    currency_symbol = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'currency', 'exchange_rate',
            'issue_date', 'due_date', 'status', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'notes', 'terms_conditions',
            'items', 'currency_symbol', 'formatted_total', 'created_at'
        ]
        read_only_fields = ['invoice_number', 'created_at']
    
    def get_currency_symbol(self, obj):
        return obj.get_currency_symbol()
    
    def get_formatted_total(self, obj):
        return obj.get_formatted_total()
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Update invoice
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items
        instance.items.all().delete()
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=instance, **item_data)
        
        instance.calculate_totals()
        instance.save()
        return instance


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_company_name = serializers.CharField(source='client.company_name', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True)
    client_address = serializers.CharField(source='client.address', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    currency_symbol = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    formatted_subtotal = serializers.SerializerMethodField()
    formatted_tax = serializers.SerializerMethodField()
    formatted_discount = serializers.SerializerMethodField()
    tax_rate = serializers.SerializerMethodField()
    discount_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_name', 'client_email',
            'client_company_name', 'client_phone', 'client_address',
            'created_by', 'created_by_name', 'currency', 'exchange_rate',
            'issue_date', 'due_date', 'status', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'notes', 'terms_conditions',
            'items', 'currency_symbol', 'formatted_total', 'formatted_subtotal',
            'formatted_tax', 'formatted_discount', 'tax_rate', 'discount_rate',
            'created_at', 'updated_at'
        ]
    
    def get_currency_symbol(self, obj):
        return obj.get_currency_symbol()
    
    def get_formatted_total(self, obj):
        return obj.get_formatted_total()
    
    def get_formatted_subtotal(self, obj):
        return f"{obj.get_currency_symbol()} {obj.subtotal:,.2f}"
    
    def get_formatted_tax(self, obj):
        return f"{obj.get_currency_symbol()} {obj.tax_amount:,.2f}"
    
    def get_formatted_discount(self, obj):
        return f"{obj.get_currency_symbol()} {obj.discount_amount:,.2f}"
    
    def get_tax_rate(self, obj):
        # Calculate tax rate from tax amount and subtotal
        if obj.subtotal > 0:
            return round((obj.tax_amount / obj.subtotal) * 100, 2)
        return 0
    
    def get_discount_rate(self, obj):
        # Calculate discount rate from discount amount and subtotal
        if obj.subtotal > 0:
            return round((obj.discount_amount / obj.subtotal) * 100, 2)
        return 0


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    currency_symbol = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_name', 'client_email',
            'currency', 'currency_symbol', 'formatted_total', 'issue_date',
            'due_date', 'status', 'status_display', 'total_amount', 'created_at'
        ]
    
    def get_currency_symbol(self, obj):
        return obj.get_currency_symbol()
    
    def get_formatted_total(self, obj):
        return obj.get_formatted_total()


class InvoiceStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['status']


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone', 'address', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role'] 