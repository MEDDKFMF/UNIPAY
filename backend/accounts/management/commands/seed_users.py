from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction


class Command(BaseCommand):
    help = "Seed initial users: one platform admin and one regular user (yk)."

    def add_arguments(self, parser):
        parser.add_argument('--admin-email', type=str, default='admin@example.com', help='Admin email')
        parser.add_argument('--admin-username', type=str, default='admin', help='Admin username')
        parser.add_argument('--admin-password', type=str, default='Admin@12345', help='Admin password')

        parser.add_argument('--user-email', type=str, default='yk@example.com', help='User email')
        parser.add_argument('--user-username', type=str, default='yk', help='User username')
        parser.add_argument('--user-password', type=str, default='User@12345', help='User password')

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()

        admin_email = options['admin_email']
        admin_username = options['admin_username']
        admin_password = options['admin_password']

        user_email = options['user_email']
        user_username = options['user_username']
        user_password = options['user_password']

        # Create or update platform admin
        admin_user, created_admin = User.objects.get_or_create(
            username=admin_username,
            defaults={
                'email': admin_email,
                'role': 'platform_admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created_admin:
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Created platform admin '{admin_username}'"))
        else:
            # Ensure permissions in case user existed already
            updated = False
            if not admin_user.is_staff or not admin_user.is_superuser or admin_user.role != 'platform_admin':
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.role = 'platform_admin'
                updated = True
            if updated:
                admin_user.save()
                self.stdout.write(self.style.WARNING(f"Updated existing admin '{admin_username}' permissions/role"))
            else:
                self.stdout.write(self.style.NOTICE(f"Admin '{admin_username}' already exists"))

        # Create or update regular user (yk)
        reg_user, created_user = User.objects.get_or_create(
            username=user_username,
            defaults={
                'email': user_email,
                'role': 'client',
                'is_active': True,
            }
        )
        if created_user:
            reg_user.set_password(user_password)
            reg_user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user '{user_username}'"))
        else:
            self.stdout.write(self.style.NOTICE(f"User '{user_username}' already exists"))

        self.stdout.write(self.style.SUCCESS('Seeding completed.'))


