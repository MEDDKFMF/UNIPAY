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
    export_invoices_csv,
    track_email_delivery,
    track_email_opened,
    track_email_clicked,
    track_email_bounced,
    get_email_tracking_stats
)

urlpatterns = [
    # Invoice management endpoints
    path('', InvoiceListView.as_view(), name='invoice_list'),
    path('stats/', invoice_stats_view, name='invoice_stats'),
    path('export/', export_invoices_csv, name='export_invoices'),
    path('<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('<int:pk>/status/', InvoiceStatusUpdateView.as_view(), name='invoice_status'),
    path('<int:pk>/pdf/', invoice_pdf_view, name='invoice_pdf'),
    
    # Email tracking endpoints
    path('email-tracking/stats/', get_email_tracking_stats, name='email_tracking_stats'),
    path('<int:invoice_id>/track/delivery/', track_email_delivery, name='track_email_delivery'),
    path('<int:invoice_id>/track/opened/', track_email_opened, name='track_email_opened'),
    path('<int:invoice_id>/track/clicked/', track_email_clicked, name='track_email_clicked'),
    path('<int:invoice_id>/track/bounced/', track_email_bounced, name='track_email_bounced'),
] 