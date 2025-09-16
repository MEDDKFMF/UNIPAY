"""
URL patterns for invoice management.
"""

from django.urls import path
from .views import (
    InvoiceListView,
    InvoiceDetailView,
    InvoiceStatusUpdateView,
    invoice_pdf_view,
    invoice_stats_view,
    export_invoices_csv
)

urlpatterns = [
    # Invoice management endpoints
    path('', InvoiceListView.as_view(), name='invoice_list'),
    path('stats/', invoice_stats_view, name='invoice_stats'),
    path('export/', export_invoices_csv, name='export_invoices'),
    path('<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('<int:pk>/status/', InvoiceStatusUpdateView.as_view(), name='invoice_status'),
    path('<int:pk>/pdf/', invoice_pdf_view, name='invoice_pdf'),
] 