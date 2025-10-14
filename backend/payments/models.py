from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid


class UserPaymentMethod(models.Model):
    """
    User's payment receiving methods (where they want to receive payments).
    Platform handles gateway integration, users just specify their details.
    """
    PAYMENT_TYPE_CHOICES = [
        ('bank_account', 'Bank Account'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )
    
    # Payment method details
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPE_CHOICES,
        help_text="Type of payment method"
    )
    
    # Bank Account Details
    bank_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Bank name"
    )
    bank_account_number = models.CharField(
        max_length=50,
        blank=True,
        help_text="Account number"
    )
    bank_account_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Account holder name"
    )
    bank_swift_code = models.CharField(
        max_length=20,
        blank=True,
        help_text="SWIFT/BIC code"
    )
    bank_branch_code = models.CharField(
        max_length=20,
        blank=True,
        help_text="Branch code"
    )
    
    # M-Pesa Details
    mpesa_phone_number = models.CharField(
        max_length=15,
        blank=True,
        validators=[RegexValidator(
            regex=r'^254\d{9}$',
            message='Phone number must be in format 254XXXXXXXXX'
        )],
        help_text="M-Pesa phone number"
    )
    mpesa_account_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="M-Pesa account name"
    )
    
    # Card Details (for receiving payments)
    card_last_four = models.CharField(
        max_length=4,
        blank=True,
        help_text="Last 4 digits of card"
    )
    card_brand = models.CharField(
        max_length=20,
        blank=True,
        help_text="Card brand (Visa, Mastercard, etc.)"
    )
    card_expiry = models.CharField(
        max_length=7,
        blank=True,
        help_text="Card expiry (MM/YYYY)"
    )
    
    # Other payment details
    payment_details = models.TextField(
        blank=True,
        help_text="Additional payment details"
    )
    
    # Status
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary payment method for this user"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this payment method is active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Payment Method"
        verbose_name_plural = "User Payment Methods"
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        if self.payment_type == 'bank_account':
            return f"Bank Account - {self.bank_name} ****{self.bank_account_number[-4:]}"
        elif self.payment_type == 'mpesa':
            return f"M-Pesa - {self.mpesa_phone_number}"
        elif self.payment_type == 'card':
            return f"Card - {self.card_brand} ****{self.card_last_four}"
        else:
            return f"{self.get_payment_type_display()} - {self.payment_details[:20]}..."


class ClientPaymentMethod(models.Model):
    """
    Client payment methods for recurring payments and one-time payments.
    Users can store client card/account details for recurring billing.
    """
    PAYMENT_TYPE_CHOICES = [
        ('bank_account', 'Bank Account'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_payment_methods'
    )
    client = models.ForeignKey(
        'accounts.Client',
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )
    
    # Payment method details
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPE_CHOICES,
        help_text="Type of payment method"
    )
    
    # Card Details
    card_last_four = models.CharField(
        max_length=4,
        blank=True,
        help_text="Last 4 digits of card"
    )
    card_brand = models.CharField(
        max_length=20,
        blank=True,
        help_text="Card brand (Visa, Mastercard, etc.)"
    )
    card_expiry = models.CharField(
        max_length=7,
        blank=True,
        help_text="Card expiry (MM/YYYY)"
    )
    card_holder_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Card holder name"
    )
    
    # Bank Account Details
    bank_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Bank name"
    )
    bank_account_number = models.CharField(
        max_length=50,
        blank=True,
        help_text="Account number"
    )
    bank_account_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Account holder name"
    )
    
    # M-Pesa Details
    mpesa_phone_number = models.CharField(
        max_length=15,
        blank=True,
        validators=[RegexValidator(
            regex=r'^254\d{9}$',
            message='Phone number must be in format 254XXXXXXXXX'
        )],
        help_text="M-Pesa phone number"
    )
    
    # Other payment details
    payment_details = models.TextField(
        blank=True,
        help_text="Additional payment details"
    )
    
    # Recurring payment settings
    is_recurring_enabled = models.BooleanField(
        default=False,
        help_text="Enable recurring payments with this method"
    )
    recurring_frequency = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly'),
            ('yearly', 'Yearly'),
        ],
        blank=True,
        help_text="Recurring payment frequency"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this payment method is active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Client Payment Method"
        verbose_name_plural = "Client Payment Methods"
        ordering = ['-created_at']


class PaymentLink(models.Model):
    """
    Public tokenized link that references a Payment record so clients can pay
    without requiring a logged-in client portal.
    """
    token = models.CharField(max_length=64, unique=True, default=lambda: uuid.uuid4().hex)
    payment = models.OneToOneField('Payment', on_delete=models.CASCADE, related_name='payment_link')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Payment Link'
        verbose_name_plural = 'Payment Links'

    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    def __str__(self):
        return f"PaymentLink {self.token} -> Payment {self.payment_id}"
    
    def __str__(self):
        if self.payment_type == 'card':
            return f"{self.client.name} - {self.card_brand} ****{self.card_last_four}"
        elif self.payment_type == 'bank_account':
            return f"{self.client.name} - Bank Account ****{self.bank_account_number[-4:]}"
        elif self.payment_type == 'mpesa':
            return f"{self.client.name} - M-Pesa {self.mpesa_phone_number}"
        else:
            return f"{self.client.name} - {self.get_payment_type_display()}"


class PlatformPaymentGateway(models.Model):
    """
    Platform-level payment gateway configuration.
    Contains API keys and settings managed by platform administrators.
    """
    GATEWAY_CHOICES = [
        ('stripe', 'Stripe'),
        ('mpesa', 'M-Pesa (legacy)'),
    ]
    
    name = models.CharField(
        max_length=50,
        choices=GATEWAY_CHOICES,
        unique=True,
        help_text="Payment gateway name"
    )
    
    # API Configuration (Platform managed)
    api_secret_key = models.CharField(
        max_length=500,
        help_text="Platform's API secret key for this gateway"
    )
    api_public_key = models.CharField(
        max_length=500,
        help_text="Platform's API public key for this gateway"
    )
    webhook_secret = models.CharField(
        max_length=500,
        blank=True,
        help_text="Platform's webhook secret for this gateway"
    )
    
    # Gateway-specific settings
    environment = models.CharField(
        max_length=20,
        choices=[('sandbox', 'Sandbox'), ('live', 'Live')],
        default='sandbox',
        help_text="Gateway environment"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this gateway is active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Platform Payment Gateway"
        verbose_name_plural = "Platform Payment Gateways"
    
    def __str__(self):
        return f"{self.get_name_display()} ({self.environment})"
    
    def get_gateway_config(self):
        """Get gateway configuration based on gateway type"""
        if self.name == 'stripe' and self.api_secret_key and self.api_public_key:
            return {
                'secret_key': self.api_secret_key,
                'public_key': self.api_public_key,
                'webhook_secret': self.webhook_secret
            }
        elif self.name == 'flutterwave' and self.api_secret_key and self.api_public_key:
            return {
                'secret_key': self.api_secret_key,
                'public_key': self.api_public_key,
                'webhook_secret': self.webhook_secret
            }
        elif self.name == 'mpesa' and self.api_secret_key and self.api_public_key:
            return {
                'consumer_key': self.api_secret_key,
                'consumer_secret': self.api_public_key,
                'webhook_secret': self.webhook_secret
            }
        return None


class Payment(models.Model):
    """
    Payment records for invoices.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('stripe', 'Stripe'),
        ('manual', 'Manual Entry'),
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('other', 'Other'),
    ]
    
    invoice = models.ForeignKey(
        'invoices.Invoice',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Gateway-specific fields
    transaction_id = models.CharField(max_length=200, blank=True, default='')
    payment_intent_id = models.CharField(max_length=200, blank=True, default='')
    gateway_session_id = models.CharField(max_length=200, blank=True, default='')
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Manual payment fields
    payment_reference = models.CharField(max_length=200, blank=True, help_text="Reference number for manual payments")
    payment_notes = models.TextField(blank=True, help_text="Additional notes about the payment")
    payment_date = models.DateTimeField(null=True, blank=True, help_text="Actual date when payment was received")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.id} - {self.invoice.invoice_number} ({self.status})"


class Plan(models.Model):
    """
    Subscription plans for the platform.
    """
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    billing_cycle = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
        ],
        default='monthly'
    )
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.price} {self.currency}/{self.billing_cycle}"


class Subscription(models.Model):
    """
    User subscriptions to plans.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('pending', 'Pending'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(default=timezone.now)
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"