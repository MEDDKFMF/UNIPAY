"""
Views for payment processing with platform-managed gateways.
"""

import stripe
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Q
import json
import logging
from .models import Payment, Plan, Subscription, UserPaymentMethod, ClientPaymentMethod, PlatformPaymentGateway, PaymentLink
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    CreateCheckoutSessionSerializer,
    PaymentWebhookSerializer,
    PlanSerializer,
    SubscriptionSerializer,
    UserPaymentMethodSerializer,
    UserPaymentMethodCreateSerializer,
    ClientPaymentMethodSerializer,
    PlatformPaymentGatewaySerializer
)
from .serializers import PaymentLinkSerializer
from invoices.models import Invoice

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


class PaymentListView(generics.ListAPIView):
    """
    List payments for an invoice.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        invoice_id = self.kwargs.get('invoice_id')
        return Payment.objects.filter(invoice_id=invoice_id)


class UserPaymentListView(generics.ListCreateAPIView):
    """
    List all payments for the authenticated user across all their invoices.
    Create new payments.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        user = self.request.user
        return Payment.objects.filter(
            invoice__created_by=user
        ).select_related('invoice', 'invoice__client').order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create payment and update invoice status"""
        payment = serializer.save()
        
        # Update invoice status to paid if payment is completed
        if payment.status == 'completed':
            payment.invoice.status = 'paid'
            payment.invoice.save()


# User Payment Methods Views
class UserPaymentMethodListView(generics.ListCreateAPIView):
    """
    List and create user payment receiving methods.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserPaymentMethodCreateSerializer
        return UserPaymentMethodSerializer
    
    def get_queryset(self):
        return UserPaymentMethod.objects.filter(
            user=self.request.user
        ).order_by('-is_primary', '-created_at')
    
    def perform_create(self, serializer):
        """Create payment method for the authenticated user"""
        serializer.save(user=self.request.user)


class UserPaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a user payment method.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserPaymentMethodSerializer
    
    def get_queryset(self):
        return UserPaymentMethod.objects.filter(user=self.request.user)


# Client Payment Methods Views (for recurring payments)
class ClientPaymentMethodListView(generics.ListCreateAPIView):
    """
    List and create client payment methods for recurring payments.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientPaymentMethodSerializer
    
    def get_queryset(self):
        return ClientPaymentMethod.objects.filter(
            user=self.request.user
        ).select_related('client').order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create client payment method for the authenticated user"""
        serializer.save(user=self.request.user)


class ClientPaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a client payment method.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientPaymentMethodSerializer
    
    def get_queryset(self):
        return ClientPaymentMethod.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_checkout_session(request):
    """
    Create payment session for invoice payment using Unipay (M-Pesa) or Flutterwave.
    """
    serializer = CreateCheckoutSessionSerializer(data=request.data)
    if serializer.is_valid():
        invoice_id = serializer.validated_data['invoice_id']
        success_url = serializer.validated_data['success_url']
        cancel_url = serializer.validated_data['cancel_url']
        payment_method = request.data.get('payment_method', 'unipay')

        try:
            invoice = Invoice.objects.get(id=invoice_id, created_by=request.user)

            # Validate payment method
            if payment_method not in ['unipay', 'flutterwave', 'stripe']:
                return Response(
                    {'error': 'Invalid payment method. Supported: unipay, flutterwave, stripe'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get user's payment receiving method for this gateway where applicable
            user_payment_method = None
            if payment_method in ['unipay', 'flutterwave']:
                user_payment_method = UserPaymentMethod.objects.filter(
                    user=request.user,
                    payment_type=payment_method,
                    is_active=True
                ).first()

                if not user_payment_method:
                    return Response(
                        {'error': f'Please configure your {payment_method} receiving details in Payment Settings first.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Create payment record first
            payment = Payment.objects.create(
                invoice=invoice,
                amount=invoice.total_amount,
                currency=invoice.currency,
                payment_method=payment_method,
                status='pending',
                gateway_session_id=f"session_{int(timezone.now().timestamp())}",
                created_by=request.user
            )
            
            # Get platform gateway configuration
            platform_gateway = PlatformPaymentGateway.objects.get(
                name=payment_method,
                is_active=True
            )
            
            # Import payment services
            from .payment_services import UnipayService, FlutterwaveService
            
            # Prepare payment data based on gateway
            if payment_method == 'unipay':
                # Initialize Unipay service with platform credentials
                unipay_service = UnipayService(
                    consumer_key=platform_gateway.api_public_key,
                    consumer_secret=platform_gateway.api_secret_key,
                    shortcode="N/A",  # Will be provided by Unipay
                    callback_url=f"{settings.FRONTEND_URL}/api/payments/mpesa-callback/"
                )
                
                # M-Pesa STK Push
                result, error = unipay_service.stk_push(
                    phone_number=user_payment_method.mpesa_phone_number,
                    amount=float(invoice.total_amount),
                    account_reference=f"INV{invoice.id}",
                    transaction_desc=f"Payment for Invoice {invoice.invoice_number}"
                )
                
                if error:
                    payment.status = 'failed'
                    payment.error_message = error
                    payment.save()
                    return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
                
                # Update payment with M-Pesa response
                payment.gateway_session_id = result.get('CheckoutRequestID', payment.gateway_session_id)
                payment.save()
                
                return Response({
                    'payment_id': payment.id,
                    'checkout_url': success_url,
                    'message': 'M-Pesa STK Push initiated. Please check your phone to complete payment.',
                    'merchant_request_id': result.get('MerchantRequestID'),
                    'checkout_request_id': result.get('CheckoutRequestID')
                })
                
            elif payment_method == 'flutterwave':
                # Initialize Flutterwave service with platform credentials
                flutterwave_service = FlutterwaveService(
                    client_id=platform_gateway.api_public_key,
                    client_secret=platform_gateway.api_secret_key,
                    encryption_key=platform_gateway.webhook_secret
                )
                
                # Create Flutterwave payment link
                checkout_url, error = flutterwave_service.create_payment_link(
                    amount=float(invoice.total_amount),
                    email=request.user.email,
                    phone_number=user_payment_method.flutterwave_phone or user_payment_method.mpesa_phone_number,
                    name=f"{request.user.first_name} {request.user.last_name}".strip(),
                    currency=invoice.currency,
                    description=f"Payment for Invoice {invoice.invoice_number}"
                )
                
                if error:
                    payment.status = 'failed'
                    payment.error_message = error
                    payment.save()
                    return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'payment_id': payment.id,
                    'checkout_url': checkout_url,
                    'message': 'Redirecting to Flutterwave payment page...'
                })
            elif payment_method == 'stripe':
                # Create a Stripe Checkout Session and return the hosted URL
                try:
                    # Amount in smallest currency unit (e.g., cents)
                    amount_cents = int(round(float(invoice.total_amount) * 100))

                    session = stripe.checkout.Session.create(
                        payment_method_types=['card'],
                        line_items=[{
                            'price_data': {
                                'currency': invoice.currency.lower(),
                                'product_data': {
                                    'name': f'Invoice {invoice.invoice_number}',
                                },
                                'unit_amount': amount_cents,
                            },
                            'quantity': 1,
                        }],
                        mode='payment',
                        success_url=success_url,
                        cancel_url=cancel_url,
                        metadata={
                            'invoice_id': str(invoice.id),
                            'user_id': str(request.user.id),
                        }
                    )

                    # Persist session info to payment record
                    payment.gateway_session_id = session.id
                    # payment_intent may be None until completed; store if present
                    if getattr(session, 'payment_intent', None):
                        payment.payment_intent_id = session.payment_intent
                    payment.save()

                    return Response({
                        'payment_id': payment.id,
                        'checkout_url': session.url,
                        'message': 'Redirecting to Stripe Checkout...'
                    })
                except Exception as e:
                    payment.status = 'failed'
                    payment.error_message = str(e)
                    payment.save()
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        except Invoice.DoesNotExist:
            return Response(
                {'error': 'Invoice not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@require_http_methods(["POST"])
def mpesa_callback(request):
    """
    Handle M-Pesa STK Push callback
    """
    try:
        data = json.loads(request.body)
        
        # Extract callback data
        callback_metadata = data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata', {})
        merchant_request_id = data.get('Body', {}).get('stkCallback', {}).get('MerchantRequestID')
        checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
        result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
        
        # Find payment by merchant request ID or checkout request ID
        payment = Payment.objects.filter(
            gateway_session_id__in=[merchant_request_id, checkout_request_id]
        ).first()
        
        if not payment:
            logger.warning(f"Payment not found for callback: {merchant_request_id}")
            return JsonResponse({'status': 'error', 'message': 'Payment not found'})
        
        if result_code == 0:  # Success
            # Extract payment details
            amount = callback_metadata.get('Amount')
            mpesa_receipt_number = callback_metadata.get('MpesaReceiptNumber')
            transaction_date = callback_metadata.get('TransactionDate')
            phone_number = callback_metadata.get('PhoneNumber')
            
            # Update payment status
            payment.status = 'completed'
            payment.transaction_id = mpesa_receipt_number
            payment.payment_intent_id = mpesa_receipt_number
            payment.metadata.update({
                'mpesa_receipt_number': mpesa_receipt_number,
                'transaction_date': transaction_date,
                'phone_number': phone_number,
                'callback_data': data
            })
            payment.save()
            
            # Update invoice status to paid
            invoice = payment.invoice
            invoice.status = 'paid'
            invoice.save()
            
            logger.info(f"Payment {payment.id} completed successfully")
            
        else:  # Failed
            payment.status = 'failed'
            payment.metadata.update({
                'callback_data': data,
                'error_code': result_code
            })
            payment.save()
            
            logger.warning(f"Payment {payment.id} failed with code {result_code}")
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"M-Pesa callback error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)})


@csrf_exempt
@require_http_methods(["POST"])
def flutterwave_webhook(request):
    """
    Handle Flutterwave webhook events for automatic payment processing.
    """
    try:
        data = json.loads(request.body)
        
        # Verify webhook signature (optional but recommended)
        # signature = request.META.get('HTTP_VERIF_HASH')
        # if not verify_flutterwave_signature(data, signature):
        #     return JsonResponse({'status': 'error', 'message': 'Invalid signature'})
        
        event_type = data.get('event')
        
        if event_type == 'charge.completed':
            # Payment was successful
            transaction_data = data.get('data', {})
            transaction_id = transaction_data.get('id')
            tx_ref = transaction_data.get('tx_ref')
            amount = transaction_data.get('amount')
            currency = transaction_data.get('currency')
            status = transaction_data.get('status')
            
            # Find payment by transaction reference or ID
            payment = Payment.objects.filter(
                Q(transaction_id=tx_ref) | 
                Q(transaction_id=transaction_id) |
                Q(gateway_session_id__icontains=tx_ref)
            ).first()
            
            if payment and status == 'successful':
                # Update payment status
                payment.status = 'completed'
                payment.transaction_id = transaction_id
                payment.payment_intent_id = transaction_id
                payment.metadata.update({
                    'flutterwave_transaction_id': transaction_id,
                    'tx_ref': tx_ref,
                    'amount_paid': amount,
                    'currency': currency,
                    'webhook_data': data
                })
                payment.save()
                
                # Update invoice status to paid
                invoice = payment.invoice
                invoice.status = 'paid'
                invoice.paid_at = timezone.now()
                invoice.payment_method = 'flutterwave'
                invoice.save()
                
                # Send payment confirmation notification
                from messaging.tasks import send_payment_confirmation
                send_payment_confirmation.delay(invoice.id)
                
                logger.info(f"Flutterwave payment {payment.id} completed successfully")
                
            elif payment and status == 'failed':
                payment.status = 'failed'
                payment.error_message = f"Payment failed: {transaction_data.get('processor_response', 'Unknown error')}"
                payment.metadata.update({
                    'flutterwave_transaction_id': transaction_id,
                    'tx_ref': tx_ref,
                    'webhook_data': data
                })
                payment.save()
                
                logger.warning(f"Flutterwave payment {payment.id} failed")
        
        elif event_type == 'charge.failed':
            # Payment failed
            transaction_data = data.get('data', {})
            tx_ref = transaction_data.get('tx_ref')
            
            payment = Payment.objects.filter(
                Q(transaction_id=tx_ref) | 
                Q(gateway_session_id__icontains=tx_ref)
            ).first()
            
            if payment:
                payment.status = 'failed'
                payment.error_message = f"Payment failed: {transaction_data.get('processor_response', 'Unknown error')}"
                payment.metadata.update({
                    'webhook_data': data
                })
                payment.save()
                
                logger.warning(f"Flutterwave payment {payment.id} failed")
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Flutterwave webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)})


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Handle Stripe webhook events.
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session_completed(session)
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_intent_succeeded(payment_intent)
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_intent_failed(payment_intent)
    
    return HttpResponse(status=200)


def handle_checkout_session_completed(session):
    """
    Handle successful checkout session completion.
    """
    try:
        invoice_id = session.metadata.get('invoice_id')
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Update payment
        payment = Payment.objects.get(
            payment_intent_id=session.payment_intent
        )
        payment.status = 'completed'
        payment.completed_at = timezone.now()
        payment.transaction_id = session.payment_intent
        payment.save()
        
        # Update invoice
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.payment_method = 'stripe'
        invoice.save()
        
        # Send confirmation notifications
        from messaging.tasks import send_payment_confirmation
        send_payment_confirmation.delay(invoice.id)
        
    except (Invoice.DoesNotExist, Payment.DoesNotExist) as e:
        print(f"Error handling checkout session: {e}")


def handle_payment_intent_succeeded(payment_intent):
    """
    Handle successful payment intent.
    """
    try:
        payment = Payment.objects.get(payment_intent_id=payment_intent.id)
        payment.status = 'completed'
        payment.completed_at = timezone.now()
        payment.transaction_id = payment_intent.id
        payment.save()
        
        # Update invoice
        invoice = payment.invoice
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.payment_method = 'stripe'
        invoice.save()
        
        # Send confirmation notifications
        from messaging.tasks import send_payment_confirmation
        send_payment_confirmation.delay(invoice.id)
        
    except Payment.DoesNotExist:
        print(f"Payment not found for intent: {payment_intent.id}")


def handle_payment_intent_failed(payment_intent):
    """
    Handle failed payment intent.
    """
    try:
        payment = Payment.objects.get(payment_intent_id=payment_intent.id)
        payment.status = 'failed'
        payment.error_message = payment_intent.last_payment_error.message if payment_intent.last_payment_error else 'Payment failed'
        payment.save()
        
    except Payment.DoesNotExist:
        print(f"Payment not found for intent: {payment_intent.id}")


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_status(request, payment_id):
    """
    Get payment status.
    """
    try:
        payment = Payment.objects.get(id=payment_id)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        ) 


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment_link(request):
    """
    Create a secure payment link for an invoice that can be shared with clients.
    """
    try:
        invoice_id = request.data.get('invoice_id')
        payment_method = request.data.get('payment_method', 'flutterwave')
        
        if not invoice_id:
            return Response({'error': 'invoice_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get invoice
        try:
            invoice = Invoice.objects.get(id=invoice_id, created_by=request.user)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if invoice is already paid
        if invoice.status == 'paid':
            return Response({'error': 'Invoice is already paid'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's payment method for the selected gateway
        try:
            user_payment_method = UserPaymentMethod.objects.get(
                user=request.user,
                payment_type=payment_method,
                is_active=True
            )
        except UserPaymentMethod.DoesNotExist:
            return Response({
                'error': f'No {payment_method} payment method configured. Please set up your payment receiving details first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get platform gateway configuration
        try:
            platform_gateway = PlatformPaymentGateway.objects.get(
                name=payment_method,
                is_active=True
            )
        except PlatformPaymentGateway.DoesNotExist:
            return Response({
                'error': f'{payment_method.title()} payment gateway is not available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        payment = Payment.objects.create(
            invoice=invoice,
            amount=invoice.total_amount,
            currency=invoice.currency,
            payment_method=payment_method,
            status='pending',
            user_payment_method=user_payment_method,
            created_by=request.user
        )
        
        # Generate payment link based on method
        if payment_method == 'flutterwave':
            from .payment_services import FlutterwaveService
            
            flutterwave_service = FlutterwaveService(
                client_id=platform_gateway.api_public_key,
                client_secret=platform_gateway.api_secret_key,
                encryption_key=platform_gateway.webhook_secret
            )
            
            # Create payment link with client details
            client_email = invoice.client.email if invoice.client else request.user.email
            client_name = invoice.client.name if invoice.client else f"{request.user.first_name} {request.user.last_name}".strip()
            client_phone = invoice.client.phone if invoice.client else user_payment_method.flutterwave_phone
            
            checkout_url, error = flutterwave_service.create_payment_link(
                amount=float(invoice.total_amount),
                email=client_email,
                phone_number=client_phone,
                name=client_name,
                currency=invoice.currency,
                description=f"Payment for Invoice {invoice.invoice_number}",
                customizations={
                    'title': f"Invoice {invoice.invoice_number}",
                    'description': f"Payment for {client_name}",
                    'logo': None  # Add your logo URL here if available
                }
            )
            
            if error:
                payment.status = 'failed'
                payment.error_message = error
                payment.save()
                return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update payment with checkout URL
            payment.gateway_session_id = checkout_url
            payment.save()

            # Create an internal PaymentLink token so the client can access without login
            link = PaymentLink.objects.create(payment=payment)

            return Response({
                'payment_id': payment.id,
                'payment_link': checkout_url,
                'payment_method': payment_method,
                'amount': float(invoice.total_amount),
                'currency': invoice.currency,
                'invoice_number': invoice.invoice_number,
                'client_name': client_name,
                'expires_at': None,  # Flutterwave links don't expire by default
                'message': 'Payment link created successfully',
                'token': link.token
            })
            
        elif payment_method == 'unipay':
            # For M-Pesa, we'll create a public payment page that initiates STK Push
            payment_page_url = f"{settings.FRONTEND_URL}/pay/{payment.id}/{payment.id}"

            # Create PaymentLink token
            link = PaymentLink.objects.create(payment=payment)

            return Response({
                'payment_id': payment.id,
                'payment_link': payment_page_url,
                'payment_method': payment_method,
                'amount': float(invoice.total_amount),
                'currency': invoice.currency,
                'invoice_number': invoice.invoice_number,
                'client_name': invoice.client.name if invoice.client else f"{request.user.first_name} {request.user.last_name}".strip(),
                'expires_at': None,
                'message': 'M-Pesa payment page created successfully',
                'token': link.token
            })
        
        else:
            return Response({
                'error': f'Payment method {payment_method} not supported for payment links'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': f'Failed to create payment link: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_get_payment_link(request, token):
    """Public: retrieve payment link info by token (no auth)."""
    try:
        link = PaymentLink.objects.filter(token=token, is_active=True).select_related('payment', 'payment__invoice').first()
        if not link or link.is_expired():
            return Response({'error': 'Link not found or expired'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentLinkSerializer(link)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_initiate_payment_link(request, token):
    """Public: initiate payment for a tokenized link. Accepts optional payer data in body.
    For M-Pesa, expects {'phone_number': '2547XXXXXXXX'}. For Stripe, will create a Checkout Session and return checkout_url.
    """
    try:
        link = PaymentLink.objects.select_related('payment', 'payment__invoice', 'payment__user_payment_method').filter(token=token, is_active=True).first()
        if not link or link.is_expired():
            return Response({'error': 'Link not found or expired'}, status=status.HTTP_404_NOT_FOUND)

        payment = link.payment
        invoice = payment.invoice
        # Ensure the payment is attributed to the invoice sender (who created the invoice)
        try:
            payment.created_by = invoice.created_by
        except Exception:
            # created_by may be null in some legacy records; ignore if not present
            pass
        payment_method = payment.payment_method

        # Load platform gateway
        platform_gateway = PlatformPaymentGateway.objects.get(name=payment_method, is_active=True)

        # Payment services
        from .payment_services import UnipayService, FlutterwaveService

        if payment_method == 'unipay':
            # Use stored user_payment_method on payment (receiver)
            receiving_method = payment.user_payment_method
            if not receiving_method:
                # try to find receiver's method
                receiving_method = UserPaymentMethod.objects.filter(user=invoice.created_by, payment_type='unipay', is_active=True).first()

            if not receiving_method or not receiving_method.mpesa_phone_number:
                return Response({'error': 'Receiver does not have M-Pesa details configured'}, status=status.HTTP_400_BAD_REQUEST)

            unipay_service = UnipayService(
                consumer_key=platform_gateway.api_public_key,
                consumer_secret=platform_gateway.api_secret_key,
                shortcode="N/A",
                callback_url=f"{settings.FRONTEND_URL}/api/payments/mpesa-callback/"
            )

            payer_phone = request.data.get('phone_number')
            if not payer_phone:
                return Response({'error': 'phone_number is required for M-Pesa payments'}, status=status.HTTP_400_BAD_REQUEST)

            result, error = unipay_service.stk_push(
                phone_number=payer_phone,
                amount=float(payment.amount),
                account_reference=f"INV{invoice.id}",
                transaction_desc=f"Payment for Invoice {invoice.invoice_number}"
            )

            if error:
                payment.status = 'failed'
                payment.error_message = error
                payment.save()
                return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

            payment.gateway_session_id = result.get('CheckoutRequestID', payment.gateway_session_id)
            # persist attribution and gateway details
            payment.created_by = invoice.created_by
            payment.save()

            return Response({'message': 'M-Pesa STK Push initiated. Check phone.', 'merchant_request_id': result.get('MerchantRequestID'), 'checkout_request_id': result.get('CheckoutRequestID')})

        elif payment_method == 'flutterwave':
            flutterwave_service = FlutterwaveService(
                client_id=platform_gateway.api_public_key,
                client_secret=platform_gateway.api_secret_key,
                encryption_key=platform_gateway.webhook_secret
            )

            client_email = invoice.client.email if invoice.client else ''
            client_phone = invoice.client.phone if invoice.client else ''
            client_name = invoice.client.name if invoice.client else ''

            checkout_url, error = flutterwave_service.create_payment_link(
                amount=float(payment.amount),
                email=client_email or request.data.get('email'),
                phone_number=client_phone or request.data.get('phone_number'),
                name=client_name or request.data.get('name'),
                currency=payment.currency,
                description=f"Payment for Invoice {invoice.invoice_number}"
            )

            if error:
                payment.status = 'failed'
                payment.error_message = error
                payment.save()
                return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

            payment.gateway_session_id = checkout_url
            # persist attribution and gateway details
            payment.created_by = invoice.created_by
            payment.save()

            return Response({'checkout_url': checkout_url})

        elif payment_method == 'stripe':
            # Create Stripe Checkout Session (public)
            try:
                amount_cents = int(round(float(payment.amount) * 100))
                session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price_data': {
                            'currency': payment.currency.lower(),
                            'product_data': {'name': f'Invoice {invoice.invoice_number}'},
                            'unit_amount': amount_cents,
                        },
                        'quantity': 1,
                    }],
                    mode='payment',
                    success_url=request.data.get('success_url') or f"{settings.FRONTEND_URL}/pay/success",
                    cancel_url=request.data.get('cancel_url') or f"{settings.FRONTEND_URL}/pay/cancel",
                    metadata={'invoice_id': str(invoice.id)}
                )

                payment.gateway_session_id = session.id
                if getattr(session, 'payment_intent', None):
                    payment.payment_intent_id = session.payment_intent
                # persist attribution and gateway details
                payment.created_by = invoice.created_by
                payment.save()

                return Response({'checkout_url': session.url})
            except Exception as e:
                payment.status = 'failed'
                payment.error_message = str(e)
                payment.save()
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({'error': 'Unsupported payment method for public link'}, status=status.HTTP_400_BAD_REQUEST)

    except PlatformPaymentGateway.DoesNotExist:
        return Response({'error': 'Payment gateway not configured'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------- Platform Admin: Plans ----------------
class IsPlatformAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_platform_admin', False))


class PlanListCreateView(generics.ListCreateAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]


class PlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]


class PlanPublicListView(generics.ListAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]


# ---------------- Subscriptions ----------------
class SubscriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Platform admin can see all
        if getattr(user, 'is_platform_admin', False):
            return Subscription.objects.select_related('user', 'plan')
        # Regular users see their own
        return Subscription.objects.filter(user=user).select_related('user', 'plan')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubscriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_platform_admin', False):
            return Subscription.objects.select_related('user', 'plan')
        return Subscription.objects.filter(user=user).select_related('user', 'plan')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsPlatformAdmin])
def admin_metrics(request):
    """Comprehensive platform metrics for analytics dashboard."""
    from django.db.models import Sum, Count, Avg, Q
    from django.utils import timezone
    from datetime import timedelta
    from accounts.models import User, Organization
    from invoices.models import Invoice
    
    # Time range filtering
    time_range = request.GET.get('time_range', '30d')
    if time_range == '7d':
        days = 7
    elif time_range == '30d':
        days = 30
    elif time_range == '90d':
        days = 90
    elif time_range == '1y':
        days = 365
    else:
        days = 30
    
    start_date = timezone.now() - timedelta(days=days)
    
    # Basic counts
    total_users = User.objects.exclude(role='platform_admin').count()
    total_organizations = Organization.objects.count()
    total_plans = Plan.objects.count()
    total_subscriptions = Subscription.objects.count()
    active_subscriptions = Subscription.objects.filter(status__in=['trialing', 'active']).count()
    
    # Revenue metrics
    mrr = Subscription.objects.filter(status__in=['trialing', 'active']).aggregate(
        total=Sum('plan__price')
    )['total'] or 0
    
    # Recent activity
    new_users_30d = User.objects.filter(
        date_joined__gte=start_date
    ).exclude(role='platform_admin').count()
    
    new_organizations_30d = Organization.objects.filter(
        created_at__gte=start_date
    ).count()
    
    # Invoice metrics
    total_invoices = Invoice.objects.count()
    paid_invoices = Invoice.objects.filter(status='paid').count()
    overdue_invoices = Invoice.objects.filter(status='overdue').count()
    
    # Revenue from invoices
    total_revenue = Invoice.objects.filter(status='paid').aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    recent_revenue = Invoice.objects.filter(
        status='paid',
        updated_at__gte=start_date
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # User role distribution
    role_distribution = User.objects.exclude(role='platform_admin').values('role').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Subscription status distribution
    subscription_status = Subscription.objects.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Plan popularity
    plan_popularity = Plan.objects.annotate(
        subscription_count=Count('subscription')
    ).order_by('-subscription_count')
    
    # Geographic distribution (placeholder - would need IP geolocation)
    geographic_data = {
        'north_america': int(total_users * 0.25),
        'europe': int(total_users * 0.20),
        'asia': int(total_users * 0.18),
        'africa': int(total_users * 0.12),
        'south_america': int(total_users * 0.10),
        'oceania': int(total_users * 0.08),
        'middle_east': int(total_users * 0.05),
        'central_america': int(total_users * 0.02)
    }
    
    # Growth rates
    previous_period_start = start_date - timedelta(days=days)
    previous_period_users = User.objects.filter(
        date_joined__gte=previous_period_start,
        date_joined__lt=start_date
    ).exclude(role='platform_admin').count()
    
    user_growth_rate = 0
    if previous_period_users > 0:
        user_growth_rate = ((new_users_30d - previous_period_users) / previous_period_users) * 100
    
    # Churn rate (simplified)
    cancelled_subscriptions = Subscription.objects.filter(
        status='cancelled',
        updated_at__gte=start_date
    ).count()
    
    churn_rate = 0
    if active_subscriptions > 0:
        churn_rate = (cancelled_subscriptions / active_subscriptions) * 100
    
    return Response({
        # Basic metrics
        'total_users': total_users,
        'total_organizations': total_organizations,
        'total_plans': total_plans,
        'total_subscriptions': total_subscriptions,
        'active_subscriptions': active_subscriptions,
        
        # Revenue metrics
        'mrr': float(mrr),
        'total_revenue': float(total_revenue),
        'recent_revenue': float(recent_revenue),
        
        # Growth metrics
        'new_users_30d': new_users_30d,
        'new_organizations_30d': new_organizations_30d,
        'user_growth_rate': round(user_growth_rate, 2),
        'churn_rate': round(churn_rate, 2),
        
        # Invoice metrics
        'total_invoices': total_invoices,
        'paid_invoices': paid_invoices,
        'overdue_invoices': overdue_invoices,
        'invoice_success_rate': round((paid_invoices / total_invoices * 100) if total_invoices > 0 else 0, 2),
        
        # Distributions
        'role_distribution': list(role_distribution),
        'subscription_status': list(subscription_status),
        'plan_popularity': [
            {
                'id': plan.id,
                'name': plan.name,
                'price': float(plan.price),
                'subscription_count': plan.subscription_count
            } for plan in plan_popularity
        ],
        'geographic_distribution': geographic_data,
        
        # Time range info
        'time_range': time_range,
        'period_days': days,
        'generated_at': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsPlatformAdmin])
def admin_analytics_detailed(request):
    """Detailed analytics data including user demographics and activity."""
    from django.db.models import Sum, Count, Avg, Q
    from django.utils import timezone
    from datetime import timedelta
    from accounts.models import User, Organization
    from invoices.models import Invoice
    from accounts.serializers import UserSerializer
    
    # Time range filtering
    time_range = request.GET.get('time_range', '30d')
    if time_range == '7d':
        days = 7
    elif time_range == '30d':
        days = 30
    elif time_range == '90d':
        days = 90
    elif time_range == '1y':
        days = 365
    else:
        days = 30
    
    start_date = timezone.now() - timedelta(days=days)
    
    # Recent users with subscription info
    recent_users = User.objects.exclude(role='platform_admin').select_related(
        'organization'
    ).prefetch_related('subscriptions__plan').order_by('-date_joined')[:10]
    
    # User demographics
    user_demographics = {
        'by_role': User.objects.exclude(role='platform_admin').values('role').annotate(
            count=Count('id')
        ).order_by('-count'),
        'by_status': User.objects.exclude(role='platform_admin').values('is_active').annotate(
            count=Count('id')
        ),
        'with_subscriptions': User.objects.exclude(role='platform_admin').filter(
            subscriptions__isnull=False
        ).count(),
        'without_subscriptions': User.objects.exclude(role='platform_admin').filter(
            subscriptions__isnull=True
        ).count()
    }
    
    # Recent activity
    recent_activity = []
    
    # Recent user registrations
    for user in recent_users:
        recent_activity.append({
            'type': 'user_registration',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
            },
            'timestamp': user.date_joined,
            'description': f'{user.username} joined the platform'
        })
    
    # Recent organizations
    recent_orgs = Organization.objects.order_by('-created_at')[:5]
    for org in recent_orgs:
        recent_activity.append({
            'type': 'organization_created',
            'organization': {
                'id': org.id,
                'name': org.name,
                'owner_email': org.owner_email
            },
            'timestamp': org.created_at,
            'description': f'Organization "{org.name}" was created'
        })
    
    # Recent subscriptions
    recent_subs = Subscription.objects.select_related('user', 'plan').order_by('-created_at')[:5]
    for sub in recent_subs:
        recent_activity.append({
            'type': 'subscription_created',
            'subscription': {
                'id': sub.id,
                'plan_name': sub.plan.name,
                'status': sub.status
            },
            'user': {
                'id': sub.user.id,
                'username': sub.user.username
            },
            'timestamp': sub.created_at,
            'description': f'{sub.user.username} subscribed to {sub.plan.name}'
        })
    
    # Sort recent activity by timestamp
    recent_activity.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_activity = recent_activity[:10]
    
    # Revenue trends (monthly breakdown)
    revenue_trends = []
    for i in range(6):  # Last 6 months
        month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        
        month_revenue = Invoice.objects.filter(
            status='paid',
            updated_at__gte=month_start,
            updated_at__lt=month_end
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        revenue_trends.append({
            'month': month_start.strftime('%Y-%m'),
            'revenue': float(month_revenue)
        })
    
    revenue_trends.reverse()
    
    return Response({
        'user_demographics': user_demographics,
        'recent_activity': recent_activity,
        'revenue_trends': revenue_trends,
        'time_range': time_range,
        'generated_at': timezone.now().isoformat()
    })


# Platform Admin Views for Gateway Management


class PlatformPaymentGatewayListView(generics.ListCreateAPIView):
    """
    List and create platform payment gateways (admin only).
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    serializer_class = PlatformPaymentGatewaySerializer
    queryset = PlatformPaymentGateway.objects.all()


class PlatformPaymentGatewayDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete platform payment gateways (admin only).
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    serializer_class = PlatformPaymentGatewaySerializer
    queryset = PlatformPaymentGateway.objects.all()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_available_payment_methods(request):
    """
    Get available payment methods for the authenticated user.
    """
    # Get platform-available gateways
    platform_gateways = PlatformPaymentGateway.objects.filter(is_active=True)
    available_methods = ['manual']  # Manual is always available
    
    for gateway in platform_gateways:
        if gateway.name not in available_methods:
            available_methods.append(gateway.name)
    
    # Check which methods the user has configured receiving details for
    user_payment_methods = UserPaymentMethod.objects.filter(
        user=request.user,
        is_active=True
    ).values_list('payment_type', flat=True)
    
    configured_methods = list(user_payment_methods)
    
    return Response({
        'available_methods': available_methods,
        'configured_methods': configured_methods,
        'platform_gateways': [
            {
                'name': gateway.name,
                'environment': gateway.environment,
                'is_active': gateway.is_active
            } for gateway in platform_gateways
        ]
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def test_payment_gateway(request):
    """
    Test payment gateway configuration.
    """
    gateway = request.data.get('gateway')
    
    try:
        settings = PaymentGatewaySettings.objects.get(user=request.user)
        
        if gateway == 'stripe':
            config = settings.get_stripe_config()
            if not config:
                return Response(
                    {'error': 'Stripe configuration not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Test Stripe configuration
            stripe.api_key = config['secret_key']
            try:
                # Test by retrieving account info
                account = stripe.Account.retrieve()
                return Response({
                    'success': True,
                    'message': f'Stripe connected successfully for {account.display_name or account.id}',
                    'account_id': account.id
                })
            except stripe.error.StripeError as e:
                return Response(
                    {'error': f'Stripe test failed: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        elif gateway == 'flutterwave':
            config = settings.get_flutterwave_config()
            if not config:
                return Response(
                    {'error': 'Flutterwave configuration not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Test Flutterwave configuration (placeholder)
            return Response({
                'success': True,
                'message': 'Flutterwave configuration appears valid',
                'public_key': config['public_key'][:10] + '...'
            })
        
        elif gateway == 'mpesa':
            config = settings.get_mpesa_config()
            if not config:
                return Response(
                    {'error': 'M-Pesa configuration not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Test M-Pesa configuration (placeholder)
            return Response({
                'success': True,
                'message': 'M-Pesa configuration appears valid',
                'business_shortcode': config['business_shortcode']
            })
        
        else:
            return Response(
                {'error': 'Invalid gateway specified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except PaymentGatewaySettings.DoesNotExist:
        return Response(
            {'error': 'Payment gateway settings not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
