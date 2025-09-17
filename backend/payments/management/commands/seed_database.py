"""
Django management command to seed the database with essential data.
This command creates:
- Platform settings
- Subscription plans
- Sample users and organizations
- Sample clients
- Sample invoices and payments
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random

from accounts.models import User, Organization, Client
from payments.models import Plan, Subscription, Payment, PlatformPaymentGateway
from invoices.models import Invoice, InvoiceItem
from messaging.models import UserNotification, NotificationPreference
from settings.models import PlatformSettings, UserProfileSettings

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with essential data for the invoice platform'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Starting database seeding...')

        # Create platform settings
        self.create_platform_settings()

        # Create subscription plans
        self.create_plans()

        # Create organizations
        self.create_organizations()

        # Create users
        self.create_users()

        # Create sample clients
        self.create_clients()

        # Create sample invoices
        self.create_invoices()

        # Create sample payments
        self.create_payments()

        # Create payment gateways
        self.create_payment_gateways()

        # Create user notifications
        self.create_notifications()

        self.stdout.write(
            self.style.SUCCESS('Database seeding completed successfully!')
        )

    def clear_data(self):
        """Clear existing data (except superuser)"""
        # Keep superuser accounts
        User.objects.filter(is_superuser=False).delete()
        Organization.objects.all().delete()
        Client.objects.all().delete()
        Plan.objects.all().delete()
        Subscription.objects.all().delete()
        Invoice.objects.all().delete()
        Payment.objects.all().delete()
        UserNotification.objects.all().delete()
        PlatformPaymentGateway.objects.all().delete()

    def create_platform_settings(self):
        """Create platform settings"""
        self.stdout.write('Creating platform settings...')
        
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
            self.stdout.write('✓ Platform settings created')

    def create_plans(self):
        """Create subscription plans"""
        self.stdout.write('Creating subscription plans...')
        
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
                self.stdout.write(f'✓ Created plan: {plan.name}')

    def create_organizations(self):
        """Create sample organizations"""
        self.stdout.write('Creating organizations...')
        
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
                self.stdout.write(f'✓ Created organization: {org.name}')

    def create_users(self):
        """Create sample users"""
        self.stdout.write('Creating users...')
        
        # Get organizations
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
            
            self.stdout.write(f'✓ Created user: {user.username}')

    def create_clients(self):
        """Create sample clients"""
        self.stdout.write('Creating clients...')
        
        # Get users to assign as creators
        users = list(User.objects.filter(role__in=['admin', 'accountant']))
        if not users:
            self.stdout.write('No users found to create clients')
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
            self.stdout.write(f'✓ Created client: {client.name}')

    def create_invoices(self):
        """Create sample invoices"""
        self.stdout.write('Creating invoices...')
        
        clients = list(Client.objects.all())
        users = list(User.objects.filter(role__in=['admin', 'accountant']))
        
        if not clients or not users:
            self.stdout.write('No clients or users found to create invoices')
            return

        # Sample invoice data
        invoice_items = [
            [
                {'description': 'Web Development Services', 'quantity': 40, 'unit_price': 50.00},
                {'description': 'UI/UX Design', 'quantity': 20, 'unit_price': 30.00},
                {'description': 'Project Management', 'quantity': 10, 'unit_price': 25.00}
            ],
            [
                {'description': 'Consulting Services', 'quantity': 30, 'unit_price': 75.00},
                {'description': 'Strategy Planning', 'quantity': 15, 'unit_price': 100.00}
            ],
            [
                {'description': 'Software License', 'quantity': 1, 'unit_price': 500.00},
                {'description': 'Implementation', 'quantity': 8, 'unit_price': 60.00}
            ],
            [
                {'description': 'Marketing Campaign', 'quantity': 1, 'unit_price': 2000.00},
                {'description': 'Content Creation', 'quantity': 20, 'unit_price': 50.00}
            ],
            [
                {'description': 'Maintenance Services', 'quantity': 12, 'unit_price': 150.00},
                {'description': 'Support Package', 'quantity': 1, 'unit_price': 500.00}
            ]
        ]

        statuses = ['draft', 'sent', 'paid', 'overdue']
        currencies = ['KES', 'USD', 'EUR']

        for i, client in enumerate(clients[:5]):  # Create up to 5 invoices
            # Create invoice
            invoice = Invoice.objects.create(
                client=client,
                created_by=random.choice(users),
                currency=random.choice(currencies),
                exchange_rate=Decimal('1.0000'),
                issue_date=timezone.now().date() - timedelta(days=random.randint(1, 30)),
                due_date=timezone.now().date() + timedelta(days=random.randint(7, 30)),
                status=random.choice(statuses),
                notes=f'Thank you for your business with {client.company_name or client.name}',
                terms_conditions='Payment is due within 30 days of invoice date. Late payments may incur additional charges.'
            )

            # Add invoice items
            items = invoice_items[i % len(invoice_items)]
            for item_data in items:
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=item_data['description'],
                    quantity=Decimal(str(item_data['quantity'])),
                    unit_price=Decimal(str(item_data['unit_price']))
                )

            # Calculate totals
            invoice.calculate_totals()
            invoice.save()

            self.stdout.write(f'✓ Created invoice: {invoice.invoice_number}')

    def create_payments(self):
        """Create sample payments"""
        self.stdout.write('Creating payments...')
        
        paid_invoices = Invoice.objects.filter(status='paid')
        users = list(User.objects.filter(role__in=['admin', 'accountant']))
        
        if not paid_invoices or not users:
            self.stdout.write('No paid invoices or users found to create payments')
            return

        payment_methods = ['unipay', 'flutterwave', 'manual', 'bank_transfer']
        statuses = ['completed', 'pending', 'failed']

        for invoice in paid_invoices:
            # Create payment for paid invoices
            payment = Payment.objects.create(
                invoice=invoice,
                created_by=random.choice(users),
                amount=invoice.total_amount,
                currency=invoice.currency,
                payment_method=random.choice(payment_methods),
                status=random.choice(statuses),
                transaction_id=f'TXN{random.randint(100000, 999999)}',
                payment_reference=f'REF{random.randint(1000, 9999)}',
                payment_notes=f'Payment for invoice {invoice.invoice_number}',
                payment_date=timezone.now() - timedelta(days=random.randint(1, 10))
            )
            
            if payment.status == 'completed':
                payment.completed_at = payment.payment_date
                payment.save()

            self.stdout.write(f'✓ Created payment: {payment.id} for invoice {invoice.invoice_number}')

    def create_payment_gateways(self):
        """Create payment gateway configurations"""
        self.stdout.write('Creating payment gateways...')
        
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
                self.stdout.write(f'✓ Created payment gateway: {gateway.name}')

    def create_notifications(self):
        """Create sample user notifications"""
        self.stdout.write('Creating notifications...')
        
        users = list(User.objects.all())
        notification_types = [
            'invoice_created',
            'invoice_paid',
            'payment_received',
            'client_created',
            'system_update'
        ]

        for user in users:
            # Create a few notifications for each user
            for i in range(random.randint(2, 5)):
                notification_type = random.choice(notification_types)
                title = f"Sample {notification_type.replace('_', ' ').title()}"
                message = f"This is a sample {notification_type} notification for {user.username}"
                
                UserNotification.objects.create(
                    user=user,
                    type=notification_type,
                    title=title,
                    message=message,
                    is_read=random.choice([True, False])
                )

        self.stdout.write(f'✓ Created notifications for {len(users)} users')
