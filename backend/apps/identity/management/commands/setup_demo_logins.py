from django.core.management.base import BaseCommand
from django.db import transaction
from apps.identity.models import CustomUser, Customer
from apps.identity.demo_login import DEMO_EMAILS


class Command(BaseCommand):
    help = 'Create passwordless local demo identities; only the gated local demo endpoint can sign them in.'

    @transaction.atomic
    def handle(self, *args, **options):
        for role,email in DEMO_EMAILS.items():
            user,created=CustomUser.objects.get_or_create(email=email,defaults={'role':role,'first_name':'Demo','last_name':role.title()})
            if created:
                user.set_unusable_password()
                user.save(update_fields=['password'])
            if role=='customer':
                customer=Customer.objects.filter(email='demo-1@example.invalid',user__isnull=True).first()
                if customer:
                    customer.user=user
                    customer.save(update_fields=['user'])
                elif not Customer.objects.filter(user=user).exists():
                    Customer.objects.get_or_create(email='demo-portal@example.invalid',defaults={'user':user,'name':'Demo Customer','company_name':'DEMO - Portal Customer'})
        self.stdout.write(self.style.SUCCESS('Local Admin, Staff and Customer demo identities are ready. No existing passwords changed.'))
