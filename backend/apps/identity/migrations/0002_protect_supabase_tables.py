"""Django owns access; Supabase Data API roles must not read application tables."""
from django.db import migrations


def protect_django_tables(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    quote = schema_editor.quote_name
    tables = {'django_migrations'}
    for model in apps.get_models(include_auto_created=True):
        if model._meta.managed and not model._meta.proxy:
            tables.add(model._meta.db_table)
    existing = set(schema_editor.connection.introspection.table_names())
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')")
        roles = [row[0] for row in cursor.fetchall()]
        statements = []
        for table in sorted(tables & existing):
            qualified = 'public.' + quote(table)
            statements.append(f'ALTER TABLE {qualified} ENABLE ROW LEVEL SECURITY')
            for role in roles:
                statements.append(f'REVOKE ALL PRIVILEGES ON TABLE {qualified} FROM {quote(role)}')
        if statements:
            cursor.execute('; '.join(statements))


class Migration(migrations.Migration):
    dependencies = [
        ('identity', '0001_initial'),
        ('admin', '0003_logentry_add_action_flag_choices'),
        ('auth', '0012_alter_user_first_name_max_length'),
        ('sessions', '0001_initial'),
        ('billing', '0002_initial'),
        ('catalogue', '0001_initial'),
        ('discounts', '0001_initial'),
        ('payments', '0001_initial'),
        ('plans', '0001_initial'),
        ('quotations', '0001_initial'),
        ('subscriptions', '0001_initial'),
    ]
    # Intentionally irreversible: rolling back must not silently reopen API access.
    operations = [migrations.RunPython(protect_django_tables)]
