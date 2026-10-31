from rest_framework.permissions import BasePermission, SAFE_METHODS


class WorkspaceAccess(BasePermission):
    """Protect legacy endpoints as well as the integrated workspace adapter."""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        name = view.__class__.__name__
        if user.role == 'customer':
            return request.method in SAFE_METHODS and name in {
                'CustomerViewSet', 'ProductViewSet', 'ProductVariantViewSet',
                'SubscriptionPlanViewSet', 'PlanItemViewSet', 'QuotationViewSet',
                'SubscriptionViewSet', 'InvoiceViewSet', 'PaymentViewSet', 'me_view',
            }
        if user.role not in ('admin', 'staff'):
            return False
        if request.method not in SAFE_METHODS and name in {'TaxViewSet', 'ProductViewSet', 'ProductVariantViewSet'}:
            return user.role == 'admin'
        return True
