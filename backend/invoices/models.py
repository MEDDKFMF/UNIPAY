"""
Invoice and InvoiceItem models for the invoicing system.
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

# Currency choices
CURRENCY_CHOICES = [
    ('KES', 'Kenyan Shilling (KES)'),
    ('USD', 'US Dollar (USD)'),
    ('EUR', 'Euro (EUR)'),
    ('GBP', 'British Pound (GBP)'),
    ('NGN', 'Nigerian Naira (NGN)'),
    ('GHS', 'Ghanaian Cedi (GHS)'),
    ('ZAR', 'South African Rand (ZAR)'),
    ('UGX', 'Ugandan Shilling (UGX)'),
    ('TZS', 'Tanzanian Shilling (TZS)'),
]

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey('accounts.Client', on_delete=models.CASCADE, related_name='invoices')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invoices')
    
    # Currency support
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='KES')
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1.0000, 
                                      help_text='Exchange rate to base currency (KSH)')
    
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    
    # Email tracking fields
    email_sent_at = models.DateTimeField(blank=True, null=True, help_text='When invoice was last sent via email')
    email_delivered_at = models.DateTimeField(blank=True, null=True, help_text='When email was delivered')
    email_opened_at = models.DateTimeField(blank=True, null=True, help_text='When email was opened by client')
    email_clicked_at = models.DateTimeField(blank=True, null=True, help_text='When client clicked payment link')
    email_bounced = models.BooleanField(default=False, help_text='Whether email bounced')
    email_bounce_reason = models.TextField(blank=True, null=True, help_text='Reason for email bounce')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.client.name}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)
    
    def generate_invoice_number(self):
        """Generate unique invoice number using settings"""
        try:
            from settings.models import PlatformSettings
            platform_settings = PlatformSettings.get_settings()
            # For now, use default values since PlatformSettings doesn't have invoice numbering
            prefix = "INV"
            start_number = 1000
        except:
            prefix = "INV"
            start_number = 1000
        
        # Format: PREFIX-YYYYMM-NNNN
        year_month = timezone.now().strftime('%Y%m')
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=f"{prefix}-{year_month}-"
        ).order_by('-invoice_number').first()
        
        if last_invoice:
            try:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = start_number
        else:
            new_number = start_number
        
        return f"{prefix}-{year_month}-{new_number:04d}"
    
    def calculate_totals(self):
        """Calculate invoice totals"""
        self.subtotal = sum(item.total_price for item in self.items.all())
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        return self.total_amount
    
    def get_currency_symbol(self):
        """Get currency symbol for display"""
        currency_symbols = {
            'KES': 'KSh',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'NGN': '₦',
            'GHS': 'GH₵',
            'ZAR': 'R',
            'UGX': 'USh',
            'TZS': 'TSh',
        }
        return currency_symbols.get(self.currency, self.currency)
    
    def get_formatted_total(self):
        """Get formatted total with currency symbol"""
        return f"{self.get_currency_symbol()} {self.total_amount:,.2f}"
    
    def convert_to_base_currency(self, amount):
        """Convert amount to base currency (KSH)"""
        return amount * self.exchange_rate
    
    def mark_email_sent(self):
        """Mark invoice as sent via email"""
        from django.utils import timezone
        self.email_sent_at = timezone.now()
        self.email_bounced = False
        self.email_bounce_reason = None
        self.save(update_fields=['email_sent_at', 'email_bounced', 'email_bounce_reason'])
    
    def mark_email_delivered(self):
        """Mark email as delivered"""
        from django.utils import timezone
        self.email_delivered_at = timezone.now()
        self.save(update_fields=['email_delivered_at'])
    
    def mark_email_opened(self):
        """Mark email as opened by client"""
        from django.utils import timezone
        self.email_opened_at = timezone.now()
        self.save(update_fields=['email_opened_at'])
    
    def mark_email_clicked(self):
        """Mark payment link as clicked"""
        from django.utils import timezone
        self.email_clicked_at = timezone.now()
        self.save(update_fields=['email_clicked_at'])
    
    def mark_email_bounced(self, reason=None):
        """Mark email as bounced"""
        from django.utils import timezone
        self.email_bounced = True
        self.email_bounce_reason = reason
        self.save(update_fields=['email_bounced', 'email_bounce_reason'])
    
    def get_email_status(self):
        """Get current email status"""
        if self.email_bounced:
            return 'bounced'
        elif self.email_clicked_at:
            return 'clicked'
        elif self.email_opened_at:
            return 'opened'
        elif self.email_delivered_at:
            return 'delivered'
        elif self.email_sent_at:
            return 'sent'
        else:
            return 'not_sent'
    
    def get_email_status_display(self):
        """Get human-readable email status"""
        status_map = {
            'not_sent': 'Not Sent',
            'sent': 'Sent',
            'delivered': 'Delivered',
            'opened': 'Opened',
            'clicked': 'Clicked',
            'bounced': 'Bounced'
        }
        return status_map.get(self.get_email_status(), 'Unknown')


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} - {self.invoice.invoice_number}"