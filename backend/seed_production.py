#!/usr/bin/env python
"""
One-time script to seed the production database.
This script can be run on Render to populate the production database.
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Now import Django models
from accounts.models import User, Organization, Client
from payments.models import Plan, Subscription, Payment, PlatformPaymentGateway
from invoices.models import Invoice, InvoiceItem
from messaging.models import UserNotification, NotificationPreference
from settings.models import PlatformSettings, UserProfileSettings
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random

def seed_database():
    """Seed the production database with essential data"""
    print("Starting production database seeding...")

    # Create platform settings
    print("Creating platform settings...")
    settings, created = PlatformSettings.objects.get_or_create(pk=1)
    if created:
        settings.platform_name = 'UniPay Invoice Platform'
        settings.platform_domain = 'unipay-1gus.onrender.com'
        settings.support_email = 'support@unipay.com'
        settings.admin_email = 'admin@unipay.com'
        settings.default_currency = 'KES'
        settings.default_tax_rate = Decimal('16.00')
        settings.supported_currencies = [
            {'code': 'KES', 'name': 'Kenyan Shilling', 'symbol': 'KSh'},
            {'code': 'USD', 'name': 'US Dollar', 'symbol': '$'},
            {'code': 'EUR', 'name': 'Euro', 'symbol': '€'},
            {'code': 'GBP', 'name': 'British Pound', 'symbol': '£'},
            {'code': 'NGN', 'name': 'Nigerian Naira', 'symbol': '₦'},
            {'code': 'GHS', 'name': 'Ghanaian Cedi', 'symbol': 'GH₵'},
            {'code': 'ZAR', 'name': 'South African Rand', 'symbol': 'R'},
            {'code': 'UGX', 'name': 'Ugandan Shilling', 'symbol': 'USh'},
            {'code': 'TZS', 'name': 'Tanzanian Shilling', 'symbol': 'TSh'},
        ]
        settings.save()
        print("✓ Platform settings created")

    # Create subscription plans
    print("Creating subscription plans...")
    plans_data = [
        {
            'name': 'Free',
            'description': 'Perfect for individuals and small businesses getting started',
            'price': Decimal('0.00'),
            'currency': 'USD',
            'billing_cycle': 'monthly',
            'features': [
                'Up to 5 invoices per month',
                'Basic client management',
                'Email support',
                'PDF invoice generation',
                'Basic reporting'
            ]
        },
        {
            'name': 'Professional',
            'description': 'Ideal for growing businesses with more invoicing needs',
            'price': Decimal('19.99'),
            'currency': 'USD',
            'billing_cycle': 'monthly',
            'features': [
                'Unlimited invoices',
                'Advanced client management',
                'Payment tracking',
                'Custom branding',
                'Priority support',
                'Advanced reporting',
                'Recurring invoices',
                'Payment reminders'
            ]
        },
        {
            'name': 'Business',
            'description': 'For established businesses with team collaboration needs',
            'price': Decimal('49.99'),
            'currency': 'USD',
            'billing_cycle': 'monthly',
            'features': [
                'Everything in Professional',
                'Team collaboration',
                'Multi-user access',
                'Advanced analytics',
                'API access',
                'Custom integrations',
                'White-label options',
                'Dedicated support'
            ]
        },
        {
            'name': 'Enterprise',
            'description': 'For large organizations with custom requirements',
            'price': Decimal('99.99'),
            'currency': 'USD',
            'billing_cycle': 'monthly',
            'features': [
                'Everything in Business',
                'Custom development',
                'SLA guarantee',
                'On-premise deployment',
                'Custom security features',
                'Dedicated account manager',
                'Training and onboarding'
            ]
        }
    ]

    for plan_data in plans_data:
        plan, created = Plan.objects.get_or_create(
            name=plan_data['name'],
            defaults=plan_data
        )
        if created:
            print(f"✓ Created plan: {plan.name}")

    # Create organizations
    print("Creating organizations...")
    organizations_data = [
        {
            'name': 'Tech Solutions Ltd',
            'slug': 'tech-solutions-ltd',
            'owner_email': 'owner@techsolutions.com',
            'is_active': True
        },
        {
            'name': 'Creative Agency',
            'slug': 'creative-agency',
            'owner_email': 'owner@creativeagency.com',
            'is_active': True
        },
        {
            'name': 'Consulting Firm',
            'slug': 'consulting-firm',
            'owner_email': 'owner@consultingfirm.com',
            'is_active': True
        }
    ]

    for org_data in organizations_data:
        org, created = Organization.objects.get_or_create(
            slug=org_data['slug'],
            defaults=org_data
        )
        if created:
            print(f"✓ Created organization: {org.name}")

    # Create users
    print("Creating users...")
    organizations = list(Organization.objects.all())
    
    users_data = [
        {
            'username': 'john_doe',
            'email': 'john@techsolutions.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'admin',
            'organization': organizations[0] if organizations else None,
            'company_name': 'Tech Solutions Ltd',
            'phone': '+254712345678',
            'address': 'Nairobi, Kenya',
            'is_verified': True
        },
        {
            'username': 'jane_smith',
            'email': 'jane@creativeagency.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'admin',
            'organization': organizations[1] if len(organizations) > 1 else None,
            'company_name': 'Creative Agency',
            'phone': '+254723456789',
            'address': 'Mombasa, Kenya',
            'is_verified': True
        },
        {
            'username': 'mike_wilson',
            'email': 'mike@consultingfirm.com',
            'first_name': 'Mike',
            'last_name': 'Wilson',
            'role': 'client',
            'organization': organizations[2] if len(organizations) > 2 else None,
            'company_name': 'Consulting Firm',
            'phone': '+254734567890',
            'address': 'Kisumu, Kenya',
            'is_verified': True
        },
        {
            'username': 'sarah_jones',
            'email': 'sarah@techsolutions.com',
            'first_name': 'Sarah',
            'last_name': 'Jones',
            'role': 'accountant',
            'organization': organizations[0] if organizations else None,
            'company_name': 'Tech Solutions Ltd',
            'phone': '+254745678901',
            'address': 'Nairobi, Kenya',
            'is_verified': True
        }
    ]

    for user_data in users_data:
        # Check if user already exists
        if User.objects.filter(username=user_data['username']).exists():
            continue
            
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password='password123',  # Default password
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role=user_data['role'],
            organization=user_data['organization'],
            company_name=user_data['company_name'],
            phone=user_data['phone'],
            address=user_data['address'],
            is_verified=user_data['is_verified']
        )
        
        # Create user profile settings
        UserProfileSettings.objects.get_or_create(
            user=user,
            defaults={
                'company_name': user_data['company_name'],
                'company_email': user_data['email'],
                'company_phone': user_data['phone'],
                'company_address': user_data['address'],
                'default_currency': 'KES',
                'default_tax_rate': Decimal('16.00'),
                'invoice_number_prefix': 'INV',
                'invoice_number_start': 1000
            }
        )
        
        # Create notification preferences
        NotificationPreference.objects.get_or_create(user=user)
        
        print(f"✓ Created user: {user.username}")

    # Create sample clients
    print("Creating clients...")
    users = list(User.objects.filter(role__in=['admin', 'accountant']))
    if not users:
        print("No users found to create clients")
        return

    clients_data = [
        {
            'name': 'ABC Company Ltd',
            'email': 'contact@abccompany.com',
            'phone': '+254712345678',
            'company_name': 'ABC Company Ltd',
            'address': '123 Business Street, Nairobi, Kenya',
            'tax_id': 'P123456789',
            'notes': 'Regular client with monthly invoices'
        },
        {
            'name': 'XYZ Enterprises',
            'email': 'info@xyzent.com',
            'phone': '+254723456789',
            'company_name': 'XYZ Enterprises',
            'address': '456 Enterprise Avenue, Mombasa, Kenya',
            'tax_id': 'P987654321',
            'notes': 'New client, prefers email communication'
        },
        {
            'name': 'Global Solutions Inc',
            'email': 'billing@globalsolutions.com',
            'phone': '+254734567890',
            'company_name': 'Global Solutions Inc',
            'address': '789 Global Plaza, Kisumu, Kenya',
            'tax_id': 'P456789123',
            'notes': 'International client, USD payments'
        },
        {
            'name': 'Local Business Co',
            'email': 'admin@localbusiness.co.ke',
            'phone': '+254745678901',
            'company_name': 'Local Business Co',
            'address': '321 Local Street, Nakuru, Kenya',
            'tax_id': 'P789123456',
            'notes': 'Small business, quarterly invoices'
        },
        {
            'name': 'Tech Startup Ltd',
            'email': 'finance@techstartup.com',
            'phone': '+254756789012',
            'company_name': 'Tech Startup Ltd',
            'address': '654 Innovation Hub, Eldoret, Kenya',
            'tax_id': 'P321654987',
            'notes': 'Fast-growing startup, needs flexible payment terms'
        }
    ]

    for client_data in clients_data:
        # Check if client already exists
        if Client.objects.filter(email=client_data['email']).exists():
            continue
            
        client = Client.objects.create(
            name=client_data['name'],
            email=client_data['email'],
            phone=client_data['phone'],
            company_name=client_data['company_name'],
            address=client_data['address'],
            tax_id=client_data['tax_id'],
            notes=client_data['notes'],
            created_by=random.choice(users)
        )
        print(f"✓ Created client: {client.name}")

    # Create payment gateways
    print("Creating payment gateways...")
    gateways_data = [
        {
            'name': 'unipay',
            'api_secret_key': 'sk_test_unipay_secret_key_here',
            'api_public_key': 'pk_test_unipay_public_key_here',
            'webhook_secret': 'whsec_unipay_webhook_secret_here',
            'environment': 'sandbox',
            'is_active': True
        },
        {
            'name': 'flutterwave',
            'api_secret_key': 'sk_test_flutterwave_secret_key_here',
            'api_public_key': 'pk_test_flutterwave_public_key_here',
            'webhook_secret': 'whsec_flutterwave_webhook_secret_here',
            'environment': 'sandbox',
            'is_active': True
        }
    ]

    for gateway_data in gateways_data:
        gateway, created = PlatformPaymentGateway.objects.get_or_create(
            name=gateway_data['name'],
            defaults=gateway_data
        )
        if created:
            print(f"✓ Created payment gateway: {gateway.name}")

    print("Production database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
