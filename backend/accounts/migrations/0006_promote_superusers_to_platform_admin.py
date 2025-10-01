from django.db import migrations


def promote_superusers_to_platform_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Promote any existing superusers to platform_admin role
    User.objects.filter(is_superuser=True).exclude(role='platform_admin').update(role='platform_admin')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_usersession'),
    ]

    operations = [
        migrations.RunPython(promote_superusers_to_platform_admin, migrations.RunPython.noop),
    ]


