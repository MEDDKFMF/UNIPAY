# Generated manually for email tracking fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0003_alter_invoice_currency'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='email_sent_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When invoice was last sent via email'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='email_delivered_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When email was delivered'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='email_opened_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When email was opened by client'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='email_clicked_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When client clicked payment link'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='email_bounced',
            field=models.BooleanField(default=False, help_text='Whether email bounced'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='email_bounce_reason',
            field=models.TextField(blank=True, null=True, help_text='Reason for email bounce'),
        ),
    ]
