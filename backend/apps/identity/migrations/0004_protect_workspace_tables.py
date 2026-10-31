import importlib
from django.db import migrations

protect = importlib.import_module('apps.identity.migrations.0002_protect_supabase_tables').protect_django_tables


class Migration(migrations.Migration):
    dependencies = [
        ('identity', '0003_workspaceaudit_workspacesettings_customer_currency_and_more'),
        ('catalogue', '0002_product_category_product_description'),
        ('plans', '0002_subscriptionplan_auto_renew_and_more'),
        ('quotations', '0002_quotation_accepted_at_quotation_accepted_by_and_more'),
        ('subscriptions', '0003_subscription_discount'),
    ]
    operations = [migrations.RunPython(protect)]
