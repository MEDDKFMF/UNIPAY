from celery import shared_task
from django.utils import timezone
from .models import Notification, MessageTemplate
from .services import EmailService, SMSService, WhatsAppService, MessagingService
from invoices.models import Invoice
from payments.models import Payment


@shared_task
def send_payment_confirmation(invoice_id):
    """
    Send payment confirmation notifications via email, SMS, and WhatsApp
    """
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        payment = Payment.objects.filter(invoice=invoice, status='completed').first()
        
        if not payment:
            return False
            
        # Send email confirmation
        if invoice.client.email:
            EmailService.send_payment_confirmation_email(invoice, invoice.client.email)
        
        # Send SMS confirmation
        if invoice.client.phone:
            SMSService.send_payment_confirmation_sms(invoice, invoice.client.phone)
        
        # Send WhatsApp confirmation
        if invoice.client.phone:
            WhatsAppService.send_payment_confirmation_whatsapp(invoice, invoice.client.phone)
            
        return True
    except Invoice.DoesNotExist:
        return False
    except Exception as e:
        print(f"Error sending payment confirmation: {e}")
        return False


@shared_task
def send_invoice_notification(invoice_id, notification_type='invoice_created'):
    """
    Send invoice notifications via email, SMS, and WhatsApp
    """
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Send email notification
        if invoice.client.email:
            EmailService.send_invoice_email(invoice, invoice.client.email, notification_type)
        
        # Send SMS notification
        if invoice.client.phone:
            SMSService.send_invoice_sms(invoice, invoice.client.phone, notification_type)
        
        # Send WhatsApp notification
        if invoice.client.phone:
            WhatsAppService.send_invoice_whatsapp(invoice, invoice.client.phone, notification_type)
            
        return True
    except Invoice.DoesNotExist:
        return False
    except Exception as e:
        print(f"Error sending invoice notification: {e}")
        return False


@shared_task
def send_payment_reminder(invoice_id):
    """
    Send payment reminder notifications for overdue invoices
    """
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        if invoice.status == 'paid':
            return False
            
        # Send email reminder
        if invoice.client.email:
            EmailService.send_invoice_email(invoice, invoice.client.email, 'invoice_reminder')
        
        # Send SMS reminder
        if invoice.client.phone:
            SMSService.send_invoice_sms(invoice, invoice.client.phone, 'invoice_reminder')
        
        # Send WhatsApp reminder
        if invoice.client.phone:
            WhatsAppService.send_invoice_whatsapp(invoice, invoice.client.phone, 'invoice_reminder')
            
        return True
    except Invoice.DoesNotExist:
        return False
    except Exception as e:
        print(f"Error sending payment reminder: {e}")
        return False


@shared_task
def send_bulk_invoice_notifications(invoice_ids, notification_type='invoice_created'):
    """
    Send bulk invoice notifications for multiple invoices
    """
    results = []
    for invoice_id in invoice_ids:
        result = send_invoice_notification.delay(invoice_id, notification_type)
        results.append(result)
    return results


@shared_task
def cleanup_old_notifications(days=30):
    """
    Clean up old notification records
    """
    cutoff_date = timezone.now() - timezone.timedelta(days=days)
    deleted_count = Notification.objects.filter(created_at__lt=cutoff_date).delete()[0]
    return deleted_count


@shared_task
def retry_failed_notifications():
    """
    Retry failed notifications
    """
    failed_notifications = Notification.objects.filter(status='failed')
    retry_count = 0
    
    for notification in failed_notifications:
        try:
            invoice = notification.invoice
            if notification.notification_type == 'email':
                success = EmailService.send_invoice_email(invoice, notification.recipient)
            elif notification.notification_type == 'sms':
                success = SMSService.send_invoice_sms(invoice, notification.recipient)
            elif notification.notification_type == 'whatsapp':
                success = WhatsAppService.send_invoice_whatsapp(invoice, notification.recipient)
            
            if success:
                notification.status = 'sent'
                notification.sent_at = timezone.now()
                notification.save()
                retry_count += 1
                
        except Exception as e:
            notification.error_message = str(e)
            notification.save()
    
    return retry_count 