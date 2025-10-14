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

class FlutterwaveService:
    """
    Flutterwave API integration service
    """
    
    def __init__(self, client_id, client_secret, encryption_key):

def process_payment(gateway, payment_data):
    """
    Process payment using the specified gateway
    """
"""
Legacy gateway services removed.

This module previously contained Unipay (M-Pesa) and Flutterwave integration helpers.
Those legacy gateways were intentionally removed from the codebase. If you need to
reintroduce a gateway, add a new service implementation here.

Keeping a small sentinel to make failures explicit when code still attempts to import
these services.
"""

import logging

logger = logging.getLogger(__name__)


class LegacyGatewayRemovedError(RuntimeError):
    pass


def raise_removed(gateway_name: str = "legacy"):
    msg = f"Payment gateway '{gateway_name}' has been removed from this codebase."
    logger.error(msg)
    raise LegacyGatewayRemovedError(msg)


# Export small API so imports don't crash immediately but are explicit when used.
def UnipayService(*args, **kwargs):
    raise_removed('unipay')


def FlutterwaveService(*args, **kwargs):
    raise_removed('flutterwave')
