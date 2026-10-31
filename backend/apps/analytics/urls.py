from django.urls import path
from .views import finance_dashboard_metrics

urlpatterns = [
    path('dashboard/', finance_dashboard_metrics, name='finance-dashboard-metrics'),
]
