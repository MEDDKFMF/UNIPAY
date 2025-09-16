"""
Services for email, SMS, and WhatsApp messaging.
"""

import os
from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone
from twilio.rest import Client
from .models import Notification, MessageTemplate


class EmailService:
    """
    Service for sending emails.
    """
    
    @staticmethod
    def send_invoice_email(invoice, recipient_email, template_type='invoice_created'):
        """
        Send invoice email to client.
        """
        try:
            # Get or create template
            template, created = MessageTemplate.objects.get_or_create(
                template_type=template_type,
                defaults={
                    'name': f'{template_type.replace("_", " ").title()} Template',
                    'subject': 'Invoice {{invoice_number}} from {{company_name}}',
                    'email_template': '''
                    Dear {{client_name}},
                    
                    Please find attached invoice {{invoice_number}} for {{amount}}.
                    
                    Due Date: {{due_date}}
                    Payment Link: {{payment_link}}
                    
                    Thank you for your business!
                    
                    Best regards,
                    {{company_name}}
                    '''
                }
            )
            
            # Prepare context
            context = {
                'invoice_number': invoice.invoice_number,
                'client_name': invoice.client.name,
                'amount': f"${invoice.total_amount}",
                'due_date': invoice.due_date.strftime('%B %d, %Y'),
                'payment_link': invoice.payment_link or 'Contact us for payment details',
                'company_name': invoice.created_by.company_name or invoice.created_by.get_full_name() or 'Our Company'
            }
            
            # Render template
            subject = template.render_template('subject', context) or template.subject
            message = template.render_template('email_template', context) or template.email_template
            
            # Send email
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            
            # Attach PDF if available
            if hasattr(invoice, 'pdf_file') and invoice.pdf_file:
                email.attach_file(invoice.pdf_file.path)
            
            email.send()
            
            # Create notification record
            Notification.objects.create(
                invoice=invoice,
                notification_type='email',
                recipient=recipient_email,
                subject=subject,
                message=message,
                status='sent',
                sent_at=timezone.now()
            )
            
            return True
            
        except Exception as e:
            # Create failed notification record
            Notification.objects.create(
                invoice=invoice,
                notification_type='email',
                recipient=recipient_email,
                subject=subject or 'Invoice Email',
                message=str(e),
                status='failed',
                error_message=str(e)
            )
            return False


class SMSService:
    """
    Service for sending SMS via Twilio.
    """
    
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_PHONE_NUMBER
    
    def send_invoice_sms(self, invoice, phone_number, template_type='invoice_created'):
        """
        Send invoice SMS to client.
        """
        try:
            # Get or create template
            template, created = MessageTemplate.objects.get_or_create(
                template_type=template_type,
                defaults={
                    'name': f'{template_type.replace("_", " ").title()} SMS Template',
                    'sms_template': '''
                    Invoice {{invoice_number}} for {{amount}} has been created. 
                    Due: {{due_date}}. 
                    Pay: {{payment_link}}
                    '''
                }
            )
            
            # Prepare context
            context = {
                'invoice_number': invoice.invoice_number,
                'amount': f"${invoice.total_amount}",
                'due_date': invoice.due_date.strftime('%m/%d/%Y'),
                'payment_link': invoice.payment_link or 'Contact us for payment'
            }
            
            # Render template
            message = template.render_template('sms_template', context) or template.sms_template
            
            # Send SMS
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=phone_number
            )
            
            # Create notification record
            Notification.objects.create(
                invoice=invoice,
                notification_type='sms',
                recipient=phone_number,
                message=message,
                status='sent',
                provider_message_id=message_obj.sid,
                sent_at=timezone.now()
            )
            
            return True
            
        except Exception as e:
            # Create failed notification record
            Notification.objects.create(
                invoice=invoice,
                notification_type='sms',
                recipient=phone_number,
                message=str(e),
                status='failed',
                error_message=str(e)
            )
            return False


class WhatsAppService:
    """
    Service for sending WhatsApp messages via Twilio.
    """
    
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = f"whatsapp:{settings.TWILIO_PHONE_NUMBER}"
    
    def send_invoice_whatsapp(self, invoice, phone_number, template_type='invoice_created'):
        """
        Send invoice WhatsApp message to client.
        """
        try:
            # Get or create template
            template, created = MessageTemplate.objects.get_or_create(
                template_type=template_type,
                defaults={
                    'name': f'{template_type.replace("_", " ").title()} WhatsApp Template',
                    'whatsapp_template': '''
                    📄 *Invoice {{invoice_number}}*
                    
                    Amount: {{amount}}
                    Due Date: {{due_date}}
                    
                    💳 Payment Link: {{payment_link}}
                    
                    Thank you for your business!
                    '''
                }
            )
            
            # Prepare context
            context = {
                'invoice_number': invoice.invoice_number,
                'amount': f"${invoice.total_amount}",
                'due_date': invoice.due_date.strftime('%B %d, %Y'),
                'payment_link': invoice.payment_link or 'Contact us for payment details'
            }
            
            # Render template
            message = template.render_template('whatsapp_template', context) or template.whatsapp_template
            
            # Send WhatsApp message
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=f"whatsapp:{phone_number}"
            )
            
            # Create notification record
            Notification.objects.create(
                invoice=invoice,
                notification_type='whatsapp',
                recipient=phone_number,
                message=message,
                status='sent',
                provider_message_id=message_obj.sid,
                sent_at=timezone.now()
            )
            
            return True
            
        except Exception as e:
            # Create failed notification record
            Notification.objects.create(
                invoice=invoice,
                notification_type='whatsapp',
                recipient=phone_number,
                message=str(e),
                status='failed',
                error_message=str(e)
            )
            return False


class MessagingService:
    """
    Combined messaging service.
    """
    
    def __init__(self):
        self.email_service = EmailService()
        self.sms_service = SMSService()
        self.whatsapp_service = WhatsAppService()
    
    def send_invoice_notifications(self, invoice, channels=None):
        """
        Send invoice notifications through multiple channels.
        """
        if channels is None:
            channels = ['email']
        
        results = {}
        
        if 'email' in channels and invoice.client.email:
            results['email'] = self.email_service.send_invoice_email(
                invoice, invoice.client.email
            )
        
        if 'sms' in channels and invoice.client.phone:
            results['sms'] = self.sms_service.send_invoice_sms(
                invoice, invoice.client.phone
            )
        
        if 'whatsapp' in channels and invoice.client.phone:
            results['whatsapp'] = self.whatsapp_service.send_invoice_whatsapp(
                invoice, invoice.client.phone
            )
        
        return results
    
    def send_payment_confirmation(self, invoice):
        """
        Send payment confirmation notifications.
        """
        results = {}
        
        if invoice.client.email:
            results['email'] = self.email_service.send_invoice_email(
                invoice, invoice.client.email, 'payment_confirmation'
            )
        
        if invoice.client.phone:
            results['sms'] = self.sms_service.send_invoice_sms(
                invoice, invoice.client.phone, 'payment_confirmation'
            )
        
        if invoice.client.phone:
            results['whatsapp'] = self.whatsapp_service.send_invoice_whatsapp(
                invoice, invoice.client.phone, 'payment_confirmation'
            )
        
        return results 