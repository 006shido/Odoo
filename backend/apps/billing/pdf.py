import io
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_invoice_pdf(invoice) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1C1917'),
    )
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#78716C'),
    )
    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1C1917'),
    )

    story = []

    # Header Table
    header_data = [
        [
            Paragraph("<b>BRIGHTLOOP</b><br/><font size='8' color='#78716C'>Subscription Management System</font>", title_style),
            Paragraph(f"<b>INVOICE</b><br/><font color='#4F46E5'><b>{invoice.invoice_number}</b></font><br/>Status: <b>{invoice.status.upper()}</b>", meta_val),
        ]
    ]
    header_table = Table(header_data, colWidths=[330, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))

    # Bill To & Dates Table
    customer = invoice.customer
    customer_info = (
        f"<b>Billed To:</b><br/>"
        f"<b>{customer.company_name or customer.name}</b><br/>"
        f"Email: {customer.email}<br/>"
        f"{customer.billing_address or ''}"
    )
    dates_info = (
        f"<b>Issue Date:</b> {invoice.issue_date}<br/>"
        f"<b>Due Date:</b> {invoice.due_date}<br/>"
        f"<b>Billing Period:</b> {invoice.billing_period_start or 'N/A'} to {invoice.billing_period_end or 'N/A'}"
    )

    meta_table = Table(
        [[Paragraph(customer_info, meta_val), Paragraph(dates_info, meta_val)]],
        colWidths=[330, 200]
    )
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAF9')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E7E5E4')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Line Items Table
    table_data = [
        [
            Paragraph("<b>Description</b>", meta_val),
            Paragraph("<b>Qty</b>", meta_val),
            Paragraph("<b>Unit Price</b>", meta_val),
            Paragraph("<b>Tax Rate</b>", meta_val),
            Paragraph("<b>Total</b>", meta_val),
        ]
    ]

    for item in invoice.line_items.all():
        table_data.append([
            Paragraph(item.description, meta_val),
            Paragraph(str(item.quantity), meta_val),
            Paragraph(f"₹{item.unit_price:,.2f}", meta_val),
            Paragraph(f"{item.tax_rate}%", meta_val),
            Paragraph(f"₹{item.amount:,.2f}", meta_val),
        ])

    items_table = Table(table_data, colWidths=[240, 50, 80, 70, 90])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F5F5F4')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1C1917')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E7E5E4')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # Totals Summary Table
    totals_data = [
        [Paragraph("Subtotal:", meta_val), Paragraph(f"₹{invoice.subtotal:,.2f}", meta_val)],
        [Paragraph("Discount:", meta_val), Paragraph(f"-₹{invoice.discount_amount:,.2f}", meta_val)],
        [Paragraph(f"Tax ({invoice.tax_rate}%):", meta_val), Paragraph(f"₹{invoice.tax_amount:,.2f}", meta_val)],
        [Paragraph("<b>Total Amount:</b>", meta_val), Paragraph(f"<b>₹{invoice.total_amount:,.2f}</b>", meta_val)],
        [Paragraph("Amount Paid:", meta_val), Paragraph(f"₹{invoice.paid_amount:,.2f}", meta_val)],
        [Paragraph("<b>Balance Due:</b>", meta_val), Paragraph(f"<b><font color='#DC2626'>₹{invoice.balance_due:,.2f}</font></b>", meta_val)],
    ]
    totals_table = Table(totals_data, colWidths=[120, 100])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,3), (-1,3), 1, colors.HexColor('#1C1917')),
    ]))

    align_totals = Table([["", totals_table]], colWidths=[310, 220])
    story.append(align_totals)

    # Build PDF
    doc.build(story)
    return buffer.getvalue()

