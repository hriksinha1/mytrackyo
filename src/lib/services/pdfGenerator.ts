import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmtDate, fmtINR } from '../utils/formatters';

export async function generateBookingInvoicePDF(
  booking: any,
  payments: any[],
  property: any,
  customer: any,
  businessSettings: any,
  totalPaid: number,
  balanceDue: number
) {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.text(businessSettings.name || 'Hotel/Homestay', 14, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  if (property.name) {
    doc.text(`Property: ${property.name}`, 14, yPos);
    yPos += 6;
  }
  if (property.address) {
    const splitAddress = doc.splitTextToSize(property.address, 100);
    doc.text(splitAddress, 14, yPos);
    yPos += 6 * splitAddress.length;
  }
  if (property.city || property.state || property.pincode) {
    doc.text(`${property.city || ''} ${property.state || ''} ${property.pincode || ''}`, 14, yPos);
    yPos += 6;
  }
  if (property.phone || property.email) {
    doc.text(`Contact: ${property.phone || ''} | ${property.email || ''}`, 14, yPos);
    yPos += 6;
  }
  if (property.gstin || businessSettings.gstin) {
    doc.text(`GSTIN: ${property.gstin || businessSettings.gstin}`, 14, yPos);
    yPos += 6;
  }

  yPos += 10;
  
  // Document Title
  doc.setFontSize(16);
  doc.text('FULL BOOKING INVOICE', 105, yPos, { align: 'center' });
  yPos += 15;

  // Split layout for Customer and Booking
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, yPos);
  doc.text('Invoice Details:', 120, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.name || 'N/A'}`, 14, yPos);
  doc.text(`Booking Ref: ${booking.booking_no}`, 120, yPos);
  yPos += 6;

  doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, yPos);
  doc.text(`Date: ${fmtDate(new Date().toISOString())}`, 120, yPos);
  yPos += 6;

  if (customer.email) doc.text(`Email: ${customer.email}`, 14, yPos);
  doc.text(`Check-in: ${fmtDate(booking.check_in)}`, 120, yPos);
  yPos += 6;
  doc.text(`Check-out: ${fmtDate(booking.check_out)}`, 120, yPos);
  yPos += 15;

  // Booking Details Table
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Nights', 'Rooms', 'Room Type', 'Amount']],
    body: [
      [
        'Accommodation Charges',
        booking.nights,
        booking.rooms,
        booking.room_type || 'Standard',
        fmtINR(booking.base_amount)
      ]
    ],
    theme: 'plain',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    styles: { fontSize: 10 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Financial Summary
  const financials = [
    ['Base Amount', fmtINR(booking.base_amount)],
  ];
  if (booking.tax_enabled && booking.tax_amount > 0) {
    financials.push([`Taxes (GST ${booking.tax_rate}%)`, fmtINR(booking.tax_amount)]);
  }
  financials.push(['Grand Total', fmtINR(booking.grand_total)]);

  autoTable(doc, {
    startY: yPos,
    body: financials,
    theme: 'plain',
    styles: { fontSize: 10, halign: 'right' },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: 'bold' },
      1: { cellWidth: 40 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Payment History
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Transactions:', 14, yPos);
  yPos += 6;

  const validPayments = payments.filter(p => p.status === 'Completed' || p.status === 'Refunded');
  
  if (validPayments.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Receipt No', 'Method', 'Reference', 'Status', 'Amount']],
      body: validPayments.map(p => [
        fmtDate(p.date),
        p.payment_no,
        p.method,
        p.ref_id || '—',
        p.status,
        p.status === 'Refunded' ? `-${fmtINR(p.amount)}` : fmtINR(p.amount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('No payments recorded yet.', 14, yPos);
    yPos += 15;
  }

  // Final Balance
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Total Paid', fmtINR(totalPaid)],
      ['Balance Due', fmtINR(balanceDue)]
    ],
    theme: 'plain',
    styles: { fontSize: 10, halign: 'right', fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 140, textColor: [100, 100, 100] },
      1: { cellWidth: 40, textColor: balanceDue > 0 ? [166, 58, 46] : [95, 122, 87] }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 25;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated invoice and does not require a signature.', 105, yPos, { align: 'center' });

  return doc;
}

export async function generatePaymentReceiptPDF(
  booking: any,
  payment: any,
  property: any,
  customer: any,
  businessSettings: any,
  previouslyPaid: number,
  balanceDue: number
) {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.text(businessSettings.name || 'Hotel/Homestay', 14, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  if (property.name) {
    doc.text(`Property: ${property.name}`, 14, yPos);
    yPos += 6;
  }
  if (property.address) {
    const splitAddress = doc.splitTextToSize(property.address, 100);
    doc.text(splitAddress, 14, yPos);
    yPos += 6 * splitAddress.length;
  }
  if (property.city || property.state || property.pincode) {
    doc.text(`${property.city || ''} ${property.state || ''} ${property.pincode || ''}`, 14, yPos);
    yPos += 6;
  }
  if (property.phone || property.email) {
    doc.text(`Contact: ${property.phone || ''} | ${property.email || ''}`, 14, yPos);
    yPos += 6;
  }
  if (property.gstin || businessSettings.gstin) {
    doc.text(`GSTIN: ${property.gstin || businessSettings.gstin}`, 14, yPos);
    yPos += 6;
  }

  yPos += 10;
  
  // Document Title
  doc.setFontSize(16);
  doc.text('PAYMENT RECEIPT', 105, yPos, { align: 'center' });
  yPos += 15;

  // Split layout for Customer and Booking
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, yPos);
  doc.text('Receipt Details:', 120, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.name || 'N/A'}`, 14, yPos);
  doc.text(`Receipt No: ${payment.payment_no}`, 120, yPos);
  yPos += 6;

  doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, yPos);
  doc.text(`Date: ${fmtDate(payment.date)}`, 120, yPos);
  yPos += 6;

  if (customer.email) doc.text(`Email: ${customer.email}`, 14, yPos);
  doc.text(`Booking Ref: ${booking.booking_no}`, 120, yPos);
  yPos += 6;
  
  doc.text(`Check-in: ${fmtDate(booking.check_in)}`, 120, yPos);
  yPos += 6;
  doc.text(`Check-out: ${fmtDate(booking.check_out)}`, 120, yPos);
  yPos += 15;

  // Booking Details Table
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Nights', 'Rooms', 'Room Type', 'Amount']],
    body: [
      [
        'Accommodation Charges',
        booking.nights,
        booking.rooms,
        booking.room_type || 'Standard',
        fmtINR(booking.base_amount)
      ]
    ],
    theme: 'plain',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    styles: { fontSize: 10 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Financial Summary
  const financials = [
    ['Base Amount', fmtINR(booking.base_amount)],
  ];
  if (booking.tax_enabled && booking.tax_amount > 0) {
    financials.push([`Taxes (GST ${booking.tax_rate}%)`, fmtINR(booking.tax_amount)]);
  }
  financials.push(['Grand Total', fmtINR(booking.grand_total)]);

  autoTable(doc, {
    startY: yPos,
    body: financials,
    theme: 'plain',
    styles: { fontSize: 10, halign: 'right' },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: 'bold' },
      1: { cellWidth: 40 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Payment Details Table
  autoTable(doc, {
    startY: yPos,
    head: [['Payment Status', 'Previously Paid', 'Current Payment', 'Cumulative Paid', 'Balance Due']],
    body: [
      [
        balanceDue <= 0 ? 'PAID IN FULL' : 'PARTIALLY PAID',
        fmtINR(previouslyPaid),
        fmtINR(payment.amount),
        fmtINR(previouslyPaid + payment.amount),
        fmtINR(balanceDue)
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${payment.method}`, 14, yPos);
  if (payment.ref_id) {
    doc.text(`Transaction Ref: ${payment.ref_id}`, 100, yPos);
  }
  
  yPos += 25;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated receipt and does not require a signature.', 105, yPos, { align: 'center' });

  return doc;
}
