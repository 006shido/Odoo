from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date
from apps.billing.engine import run_billing_for_date

class Command(BaseCommand):
    help = 'Executes Brightloop automated recurring billing engine for due subscriptions.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Target billing date in YYYY-MM-DD format (defaults to current date).'
        )

    def handle(self, *args, **options):
        date_str = options.get('date')
        target_date = parse_date(date_str) if date_str else None

        self.stdout.write(self.style.NOTICE(f'Executing billing engine for {target_date or "today"}...'))
        run = run_billing_for_date(target_date)

        self.stdout.write(self.style.SUCCESS(
            f'Billing Run Complete:\n'
            f'- Eligible due subscriptions: {run.total_due_subscriptions}\n'
            f'- Invoices created: {run.invoices_created}\n'
            f'- Invoices skipped (already billed): {run.invoices_skipped}\n'
            f'- Total billed: ₹{run.total_billed_amount:,.2f}'
        ))

