"""
Simple PDF generation for development environment
Uses reportlab instead of WeasyPrint for easier setup
"""
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
from django.http import HttpResponse
from django.template.loader import render_to_string
from .models import Invoice


def generate_invoice_pdf_dev(invoice):
    """
    Generate a simple PDF invoice using ReportLab
    """
    # Create the HttpResponse object with PDF headers
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
    
    # Create the PDF object
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    
    # Add title
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 20))
    
    # Invoice details
    invoice_data = [
        ['Invoice Number:', invoice.invoice_number],
        ['Issue Date:', invoice.issue_date.strftime('%B %d, %Y')],
        ['Due Date:', invoice.due_date.strftime('%B %d, %Y')],
        ['Status:', invoice.status.upper()],
    ]
    
    invoice_table = Table(invoice_data, colWidths=[2*inch, 4*inch])
    invoice_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 20))
    
    # Client information
    elements.append(Paragraph("Bill To:", styles['Heading2']))
    client_data = [
        ['Name:', invoice.client.name],
        ['Email:', invoice.client.email],
        ['Phone:', invoice.client.phone],
    ]
    
    client_table = Table(client_data, colWidths=[1.5*inch, 4.5*inch])
    client_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 20))
    
    # Invoice items
    elements.append(Paragraph("Items:", styles['Heading2']))
    
    # Table headers
    headers = ['Description', 'Quantity', 'Unit Price', 'Total']
    items_data = [headers]
    
    # Add invoice items
    for item in invoice.items.all():
        items_data.append([
            item.description,
            str(item.quantity),
            f"${item.unit_price}",
            f"${item.total_price}"
        ])
    
    # Add totals
    items_data.append(['', '', 'Subtotal:', f"${invoice.subtotal}"])
    if invoice.tax_amount > 0:
        items_data.append(['', '', 'Tax:', f"${invoice.tax_amount}"])
    if invoice.discount_amount > 0:
        items_data.append(['', '', 'Discount:', f"-${invoice.discount_amount}"])
    items_data.append(['', '', 'Total:', f"${invoice.total_amount}"])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Headers
        ('FONTNAME', (2, -4), (-1, -1), 'Helvetica-Bold'),  # Totals
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -4), 1, colors.black),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.black),
        ('LINEABOVE', (0, -4), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    
    # Build PDF
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    
    response.write(pdf)
    return response


def invoice_pdf_view_dev(request, pk):
    """
    Development version of invoice PDF view
    """
    from django.shortcuts import get_object_or_404
    from rest_framework.decorators import api_view, permission_classes
    from rest_framework.permissions import IsAuthenticated
    from rest_framework import status
    from rest_framework.response import Response
    
    try:
        invoice = get_object_or_404(Invoice, pk=pk)
        
        # Check permissions
        if not (request.user.is_admin or request.user.is_accountant or invoice.created_by == request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        return generate_invoice_pdf_dev(invoice)
        
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 