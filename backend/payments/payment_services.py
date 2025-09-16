import requests
import json
import base64
from datetime import datetime
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class UnipayService:
    """
    Unipay M-Pesa API integration service
    """
    
    def __init__(self, consumer_key, consumer_secret, shortcode="N/A", callback_url=None):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.shortcode = shortcode
        self.callback_url = callback_url or "https://yourdomain.com/api/payments/mpesa-callback/"
        self.base_url = "https://sandbox.safaricom.co.ke"  # Sandbox URL
        
    def get_access_token(self):
        """
        Get access token from Unipay M-Pesa API
        """
        try:
            # Encode consumer key and secret
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('access_token')
            else:
                logger.error(f"Failed to get access token: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            return None
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate STK Push for M-Pesa payment
        """
        try:
            access_token = self.get_access_token()
            if not access_token:
                return None, "Failed to get access token"
            
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(f"{self.shortcode}{settings.MPESA_PASSKEY}{timestamp}".encode()).decode()
            
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),
                "PartyA": phone_number,
                "PartyB": self.shortcode,
                "PhoneNumber": phone_number,
                "CallBackURL": f"{settings.FRONTEND_URL}/api/payments/mpesa-callback/",
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.base_url}/mpesa/stkpush/v1/processrequest",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                return data, None
            else:
                logger.error(f"STK Push failed: {response.text}")
                return None, f"STK Push failed: {response.text}"
                
        except Exception as e:
            logger.error(f"Error initiating STK push: {str(e)}")
            return None, f"Error: {str(e)}"


class FlutterwaveService:
    """
    Flutterwave API integration service
    """
    
    def __init__(self, client_id, client_secret, encryption_key):
        self.client_id = client_id
        self.client_secret = client_secret
        self.encryption_key = encryption_key
        self.base_url = "https://api.flutterwave.com/v3"
        
    def create_payment_link(self, amount, email, phone_number, name, currency="KES", description="Invoice Payment", customizations=None):
        """
        Create Flutterwave payment link with enhanced customization options
        """
        try:
            headers = {
                'Authorization': f'Bearer {self.client_secret}',
                'Content-Type': 'application/json'
            }
            
            # Generate unique transaction reference
            tx_ref = f"INV_{int(timezone.now().timestamp())}_{hash(email) % 10000}"
            
            payload = {
                "tx_ref": tx_ref,
                "amount": float(amount),
                "currency": currency,
                "redirect_url": f"{settings.FRONTEND_URL}/app/payments/success/",
                "customer": {
                    "email": email,
                    "phonenumber": phone_number,
                    "name": name
                },
                "customizations": {
                    "title": customizations.get('title', 'Invoice Payment') if customizations else 'Invoice Payment',
                    "description": customizations.get('description', description) if customizations else description,
                    "logo": customizations.get('logo', f"{settings.FRONTEND_URL}/logo.png") if customizations else f"{settings.FRONTEND_URL}/logo.png"
                },
                "payment_options": "card,mobilemoney,banktransfer"
            }
            
            response = requests.post(
                f"{self.base_url}/payments",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return data.get('data', {}).get('link'), None
                else:
                    return None, data.get('message', 'Payment link creation failed')
            else:
                logger.error(f"Flutterwave payment creation failed: {response.text}")
                return None, f"Payment creation failed: {response.text}"
                
        except Exception as e:
            logger.error(f"Error creating Flutterwave payment: {str(e)}")
            return None, f"Error: {str(e)}"
    
    def verify_payment(self, transaction_id):
        """
        Verify Flutterwave payment status
        """
        try:
            headers = {
                'Authorization': f'Bearer {self.client_secret}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/transactions/{transaction_id}/verify",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    payment_data = data.get('data', {})
                    return {
                        'status': payment_data.get('status'),
                        'amount': payment_data.get('amount'),
                        'currency': payment_data.get('currency'),
                        'transaction_id': payment_data.get('id'),
                        'customer_email': payment_data.get('customer', {}).get('email'),
                        'created_at': payment_data.get('created_at')
                    }, None
                else:
                    return None, data.get('message', 'Payment verification failed')
            else:
                logger.error(f"Flutterwave payment verification failed: {response.text}")
                return None, f"Payment verification failed: {response.text}"
                
        except Exception as e:
            logger.error(f"Error verifying Flutterwave payment: {str(e)}")
            return None, f"Error: {str(e)}"


def process_payment(gateway, payment_data):
    """
    Process payment using the specified gateway
    """
    if gateway == 'unipay':
        service = UnipayService()
        return service.initiate_stk_push(
            phone_number=payment_data.get('phone_number'),
            amount=payment_data.get('amount'),
            account_reference=payment_data.get('account_reference'),
            transaction_desc=payment_data.get('transaction_desc')
        )
    elif gateway == 'flutterwave':
        service = FlutterwaveService()
        return service.create_payment_link(
            amount=payment_data.get('amount'),
            email=payment_data.get('email'),
            phone_number=payment_data.get('phone_number'),
            name=payment_data.get('name'),
            currency=payment_data.get('currency', 'KES'),
            description=payment_data.get('description')
        )
    else:
        return None, f"Unsupported gateway: {gateway}"
