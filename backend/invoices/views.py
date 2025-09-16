"""
Views for invoice management.
"""

import csv
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q, Sum, Count
from django.utils import timezone
# from weasyprint import HTML  # Temporarily disabled due to Windows dependency issues
from .models import Invoice, InvoiceItem
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceUpdateSerializer,
    InvoiceListSerializer,
    InvoiceStatusUpdateSerializer,
    InvoiceItemSerializer
)


class InvoiceListView(generics.ListCreateAPIView):
    """
    List and create invoices.
    """
    serializer_class = InvoiceListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related('client')
        
        # Filter by user role - temporarily show all invoices for testing
        # TODO: Implement proper role-based filtering
        queryset = queryset.filter(created_by=user)
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        client_filter = self.request.query_params.get('client')
        if client_filter:
            queryset = queryset.filter(client_id=client_filter)
        
        search_filter = self.request.query_params.get('search')
        if search_filter:
            queryset = queryset.filter(
                Q(invoice_number__icontains=search_filter) |
                Q(client__name__icontains=search_filter) |
                Q(client__email__icontains=search_filter)
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvoiceCreateSerializer
        return InvoiceListSerializer
    
    def perform_create(self, serializer):
        """Create invoice with defaults"""
        # Set default currency if not provided
        if not serializer.validated_data.get('currency'):
            serializer.validated_data['currency'] = 'KES'
        
        serializer.save(created_by=self.request.user)


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete invoice.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related('client', 'created_by').prefetch_related('items')
        
        # Filter by user role - temporarily show all invoices for testing
        # TODO: Implement proper role-based filtering
        queryset = queryset.filter(created_by=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return InvoiceUpdateSerializer
        return InvoiceSerializer


class InvoiceStatusUpdateView(generics.UpdateAPIView):
    """
    Update invoice status.
    """
    serializer_class = InvoiceStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_platform_admin', False):
            return Invoice.objects.all()
        if user.is_client:
            return Invoice.objects.filter(client__email=user.email)
        elif not (user.is_admin or user.is_accountant):
            return Invoice.objects.filter(created_by=user)
        return Invoice.objects.all()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def invoice_pdf_view(request, pk):
    """
    Generate and return PDF for invoice.
    """
    try:
        user = request.user
        # Filter by user role - temporarily show all invoices for testing
        # TODO: Implement proper role-based filtering
        invoice = Invoice.objects.select_related('client', 'created_by').prefetch_related('items').get(
            pk=pk, created_by=user
        )
        
        # Prepare header/company data for template (origin info)
        header_data = {}
        try:
            from settings.models import UserProfileSettings
            user_settings = UserProfileSettings.get_user_settings(invoice.created_by)
            header_data = user_settings.get_header_data() or {}
        except Exception:
            # Fallback to basic user data if settings not available
            header_data = {
                'company_name': getattr(invoice.created_by, 'company_name', '') or '',
                'company_email': getattr(invoice.created_by, 'email', '') or '',
                'company_phone': getattr(invoice.created_by, 'phone', '') or '',
                'company_address': getattr(invoice.created_by, 'address', '') or '',
                'company_website': getattr(invoice.created_by, 'website', '') or '',
                'show_logo': False,
                'show_contact': True,
                'show_address': True,
            }

        # Ensure logo URL is absolute for HTML/PDF rendering
        try:
            if header_data.get('company_logo'):
                header_data['company_logo'] = request.build_absolute_uri(header_data['company_logo'])
        except Exception:
            pass

        currency_symbol = invoice.get_currency_symbol()

        # Render HTML template (used for fallback or preview)
        html_string = render_to_string('invoices/invoice_pdf.html', {
            'invoice': invoice,
            'items': invoice.items.all(),
            'header_data': header_data,
            'currency_symbol': currency_symbol,
            'base_url': settings.WEASYPRINT_BASE_URL
        })
        
        # Generate PDF using ReportLab (works on Windows)
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
            from io import BytesIO
            import datetime
            
            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#2563eb')
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                spaceBefore=20,
                textColor=colors.HexColor('#374151')
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6
            )
            
            # Company header (from user profile)
            company_style = ParagraphStyle(
                'CompanyStyle',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=6,
                textColor=colors.HexColor('#1f2937')
            )
            
            company_info_style = ParagraphStyle(
                'CompanyInfoStyle',
                parent=styles['Normal'],
                fontSize=9,
                spaceAfter=3,
                textColor=colors.HexColor('#6b7280')
            )
            
            # Get user profile settings for header data
            try:
                from settings.models import UserProfileSettings
                user_settings = UserProfileSettings.get_user_settings(invoice.created_by)
                header_data = user_settings.get_header_data()
                
                # Add company name if available
                if header_data['company_name']:
                    story.append(Paragraph(header_data['company_name'], company_style))
                
                # Add custom header text if available
                if header_data['header_custom_text']:
                    custom_text_style = ParagraphStyle(
                        'CustomTextStyle',
                        parent=styles['Normal'],
                        fontSize=10,
                        spaceAfter=6,
                        textColor=colors.HexColor('#6b7280'),
                        fontStyle='italic'
                    )
                    story.append(Paragraph(header_data['header_custom_text'], custom_text_style))
                
                # Add company contact information based on visibility settings
                company_info = []
                
                if header_data['show_address'] and header_data['company_address']:
                    company_info.append(header_data['company_address'])
                
                if header_data['show_contact']:
                    if header_data['company_phone']:
                        company_info.append(f"Phone: {header_data['company_phone']}")
                    if header_data['company_email']:
                        company_info.append(f"Email: {header_data['company_email']}")
                    if header_data['company_website']:
                        company_info.append(f"Website: {header_data['company_website']}")
                
                for info in company_info:
                    story.append(Paragraph(info, company_info_style))
                    
            except Exception as e:
                # Fallback to basic user data if settings not available
                if invoice.created_by.company_name:
                    story.append(Paragraph(invoice.created_by.company_name, company_style))
                
                company_info = []
                if invoice.created_by.address:
                    company_info.append(invoice.created_by.address)
                if invoice.created_by.phone:
                    company_info.append(f"Phone: {invoice.created_by.phone}")
                if invoice.created_by.email:
                    company_info.append(f"Email: {invoice.created_by.email}")
                if invoice.created_by.website:
                    company_info.append(f"Website: {invoice.created_by.website}")
                
                for info in company_info:
                    story.append(Paragraph(info, company_info_style))
            
            story.append(Spacer(1, 15))
            
            # Title
            story.append(Paragraph("INVOICE", title_style))
            story.append(Spacer(1, 20))
            
            # Two-column header: Bill To (left) and Invoice meta (right)
            created_by_display = getattr(invoice.created_by, 'get_full_name', lambda: '')() or getattr(invoice.created_by, 'username', '')
            currency_symbol = invoice.get_currency_symbol()
            
            # Left column (Bill To)
            client = invoice.client
            left_col = [
                [Paragraph("Bill To:", heading_style)],
                [Paragraph(getattr(client, 'name', '') or '', normal_style)],
            ]
            client_company_name = getattr(client, 'company_name', '')
            if client_company_name:
                left_col.append([Paragraph(client_company_name, normal_style)])
            client_email = getattr(client, 'email', '')
            if client_email:
                left_col.append([Paragraph(client_email, normal_style)])
            client_phone = getattr(client, 'phone', '')
            if client_phone:
                left_col.append([Paragraph(client_phone, normal_style)])
            client_address = getattr(client, 'address', '')
            if client_address:
                left_col.append([Paragraph(client_address, normal_style)])
            left_table = Table(left_col, colWidths=[3.2*inch])
            left_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))

            # Right column (Invoice meta)
            right_meta = [
                ['Invoice Number:', invoice.invoice_number],
                ['Status:', invoice.get_status_display()],
                ['Issue Date:', invoice.issue_date.strftime('%B %d, %Y')],
                ['Due Date:', invoice.due_date.strftime('%B %d, %Y')],
                ['Currency:', invoice.currency],
                ['Created By:', created_by_display],
            ]
            right_table = Table(right_meta, colWidths=[1.6*inch, 2.2*inch])
            right_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ]))

            header_cols = Table([[left_table, right_table]], colWidths=[3.3*inch, 3.3*inch])
            header_cols.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(header_cols)
            story.append(Spacer(1, 18))
            
            # Invoice items
            story.append(Paragraph("Invoice Items:", heading_style))
            
            # Table headers
            items_data = [['Description', 'Quantity', 'Unit Price', 'Total']]
            
            # Add items
            for item in invoice.items.all():
                items_data.append([
                    item.description,
                    str(item.quantity),
                    f"{currency_symbol} {item.unit_price:,.2f}",
                    f"{currency_symbol} {item.total_price:,.2f}"
                ])
            
            items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
            items_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(items_table)
            story.append(Spacer(1, 20))
            
            # Totals (right-aligned box)
            story.append(Spacer(1, 6))
            totals_data = [
                ['Subtotal:', f"{currency_symbol} {invoice.subtotal:,.2f}"],
            ]
            tax_rate = round((invoice.tax_amount / invoice.subtotal) * 100, 2) if invoice.subtotal and invoice.subtotal > 0 else 0
            if tax_rate > 0:
                totals_data.append([f"Tax ({tax_rate}%):", f"{currency_symbol} {invoice.tax_amount:,.2f}"])
            discount_rate = round((invoice.discount_amount / invoice.subtotal) * 100, 2) if invoice.subtotal and invoice.subtotal > 0 else 0
            if discount_rate > 0:
                totals_data.append([f"Discount ({discount_rate}%):", f"-{currency_symbol} {invoice.discount_amount:,.2f}"])
            totals_data.append(['Total:', f"{currency_symbol} {invoice.total_amount:,.2f}"])

            totals_table = Table(totals_data, colWidths=[2.2*inch, 2.4*inch])
            totals_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -2), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (0, -2), 'Helvetica'),
                ('FONTNAME', (1, 0), (1, -2), 'Helvetica'),
                ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            totals_box = Table([[totals_table]], colWidths=[4.8*inch])
            totals_box.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            # Create a two-column row to push totals to the right
            totals_row = Table([[Spacer(1, 1), totals_box]], colWidths=[2.0*inch, 4.8*inch])
            story.append(totals_row)
            
            # Notes and terms
            if invoice.notes or invoice.terms_conditions:
                story.append(Spacer(1, 20))
                
                if invoice.notes:
                    story.append(Paragraph("Notes:", heading_style))
                    story.append(Paragraph(invoice.notes, normal_style))
                
                if invoice.terms_conditions:
                    story.append(Paragraph("Terms & Conditions:", heading_style))
                    story.append(Paragraph(invoice.terms_conditions, normal_style))
            
            # Footer
            story.append(Spacer(1, 30))
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                alignment=TA_CENTER,
                textColor=colors.grey
            )
            story.append(Paragraph(f"Generated on {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
            
            # Build PDF
            doc.build(story)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            return response
            
        except Exception as e:
            # Fallback: Return HTML with PDF-like styling
            # This ensures the frontend can still display the invoice properly
            response = HttpResponse(html_string, content_type='text/html')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.html"'
            return response
        
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def invoice_stats_view(request):
    """
    Get invoice statistics
    """
    user = request.user
    
    # Base queryset
    if user.is_admin or user.is_accountant:
        invoices = Invoice.objects.all()
    else:
        invoices = Invoice.objects.filter(created_by=user)
    
    # Calculate statistics
    total_invoices = invoices.count()
    total_revenue = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
    paid_invoices = invoices.filter(status='paid').count()
    overdue_invoices = invoices.filter(status='overdue').count()
    
    # Monthly stats
    current_month = timezone.now().month
    current_year = timezone.now().year
    monthly_invoices = invoices.filter(
        created_at__month=current_month,
        created_at__year=current_year
    )
    monthly_revenue = monthly_invoices.aggregate(total=Sum('total_amount'))['total'] or 0
    
    return Response({
        'total_invoices': total_invoices,
        'total_revenue': total_revenue,
        'paid_invoices': paid_invoices,
        'overdue_invoices': overdue_invoices,
        'monthly_revenue': monthly_revenue,
        'monthly_invoices': monthly_invoices.count(),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_invoices_csv(request):
    """
    Export invoices to CSV.
    """
    user = request.user
    
    if user.is_client:
        queryset = Invoice.objects.filter(client__email=user.email)
    elif not (user.is_admin or user.is_accountant):
        queryset = Invoice.objects.filter(created_by=user)
    else:
        queryset = Invoice.objects.all()
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="invoices.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Status',
        'Total Amount', 'Created At'
    ])
    
    for invoice in queryset:
        writer.writerow([
            invoice.invoice_number,
            invoice.client.name,
            invoice.issue_date,
            invoice.due_date,
            invoice.get_status_display(),
            invoice.total_amount,
            invoice.created_at
        ])
    
    return response 
