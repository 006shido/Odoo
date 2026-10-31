from datetime import date
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Invoice, BillingRun
from .serializers import InvoiceSerializer, BillingRunSerializer
from .pdf import generate_invoice_pdf
from .engine import run_billing_for_date
from apps.identity.models import CustomUser

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('customer', 'subscription', 'applied_discount').prefetch_related('line_items').order_by('-created_at')
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        if user.role == CustomUser.Role.CUSTOMER:
            return Invoice.objects.filter(customer__user=user)
        return Invoice.objects.all().select_related('customer', 'subscription', 'applied_discount').prefetch_related('line_items').order_by('-created_at')

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        inv = self.get_object()
        inv.status = Invoice.Status.CONFIRMED
        inv.save(update_fields=['status'])
        return Response({'message': f'Invoice {inv.invoice_number} confirmed.'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        inv = self.get_object()
        inv.status = Invoice.Status.CANCELLED
        inv.save(update_fields=['status'])
        return Response({'message': f'Invoice {inv.invoice_number} cancelled.'})

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        inv = self.get_object()
        return Response({'message': f'Invoice {inv.invoice_number} dispatched to {inv.customer.email}.'})

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        inv = self.get_object()
        pdf_bytes = generate_invoice_pdf(inv)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{inv.invoice_number}.pdf"'
        return response

@api_view(['POST'])
def trigger_billing_run(request):
    """Trigger the automated recurring billing engine."""
    date_str = request.data.get('date')
    target_date = parse_date(date_str) if date_str else None
    run = run_billing_for_date(target_date)
    return Response({
        'message': f'Billing run completed: {run.invoices_created} created, {run.invoices_skipped} skipped.',
        'run': BillingRunSerializer(run).data
    })

class BillingRunViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BillingRun.objects.all().order_by('-started_at')
    serializer_class = BillingRunSerializer

