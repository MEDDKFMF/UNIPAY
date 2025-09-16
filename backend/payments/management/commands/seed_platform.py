from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from payments.models import Plan, Subscription


class Command(BaseCommand):
    help = "Seed default subscription plans and ensure a platform admin exists."

    def add_arguments(self, parser):
        parser.add_argument('--admin-username', type=str, help='Username to promote to platform_admin if provided')

    def handle(self, *args, **options):
        User = get_user_model()

        # Plans
        plans_data = [
            {
                'name': 'Starter',
                'description': 'For individuals getting started',
                'price': 9.99,
                'currency': 'USD',
                'interval': 'month',
                'features': ['Up to 100 invoices/month', 'Basic support'],
                'limits': {'invoices_per_month': 100},
            },
            {
                'name': 'Pro',
                'description': 'For growing teams',
                'price': 29.99,
                'currency': 'USD',
                'interval': 'month',
                'features': ['Unlimited invoices', 'Priority support', 'Advanced export'],
                'limits': {'invoices_per_month': None},
            },
        ]

        for p in plans_data:
            plan, created = Plan.objects.get_or_create(
                name=p['name'],
                defaults={k: v for k, v in p.items() if k != 'name'}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created plan: {plan.name}"))
            else:
                self.stdout.write(f"Plan exists: {plan.name}")

        # Promote platform admin
        admin_username = options.get('admin_username')
        platform_admin = None

        if admin_username:
            try:
                platform_admin = User.objects.get(username=admin_username)
                platform_admin.role = 'platform_admin'
                platform_admin.save(update_fields=['role'])
                self.stdout.write(self.style.SUCCESS(f"Promoted {admin_username} to platform_admin"))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"User {admin_username} not found; skipping promotion"))
        else:
            platform_admin = User.objects.filter(role='platform_admin').first()
            if platform_admin:
                self.stdout.write(f"Existing platform_admin: {platform_admin.username}")
            else:
                self.stdout.write(self.style.WARNING("No platform_admin specified or found. Use --admin-username to promote one."))

        # Optionally seed a subscription for admin if both admin and at least one plan exist
        if platform_admin:
            plan = Plan.objects.order_by('price').first()
            if plan:
                sub, created = Subscription.objects.get_or_create(
                    owner=platform_admin,
                    plan=plan,
                    defaults={
                        'status': 'active',
                        'current_period_start': timezone.now(),
                        'current_period_end': timezone.now() + timezone.timedelta(days=30),
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created subscription for {platform_admin.username} on {plan.name}"))
                else:
                    self.stdout.write(f"Subscription already exists for {platform_admin.username}")

        self.stdout.write(self.style.SUCCESS("Seeding completed."))


