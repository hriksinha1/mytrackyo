import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR, generateId } from '../../lib/utils/formatters';
import AddPaymentModal from './AddPaymentModal';
import { generatePaymentReceiptPDF, generateBookingInvoicePDF } from '../../lib/services/pdfGenerator';
import { Download, Eye, Mail, MessageCircle, FileText, Undo2 } from 'lucide-react';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const bData = await repository.getBooking(id);
      if (bData) {
        const cData = await repository.getCustomer(bData.customer_id);
        const propData = await repository.getProperty(bData.property_id);
        const pData = await repository.getPayments(id);
        const nData = await repository.getNotifications(id);
        const sData = await repository.getSettings();

        setBooking({ ...bData, customer: cData, property: propData });
        setPayments(pData || []);
        setNotifications(nData || []);
        setSettings(sData);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDemoSend(channel: string, type: string) {
    if (!booking) return;
    await repository.createNotification({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      channel,
      type,
      recipient: channel === 'Email' ? booking.customer?.email || 'Unknown' : booking.customer?.phone || 'Unknown',
      status: 'Demo Sent'
    });
    alert(`Demo ${channel} prepared and marked as "Demo Sent". No actual message was delivered.`);
    load();
  }

  async function getDocForPayment(p: any, index: number) {
    // Reconstruct previously paid for this historical receipt
    // We filter up to this index, ignoring refunds that happened after.
    // For simplicity, we just take the sum of Completed/Refunded payments before this one.
    let previouslyPaid = 0;
    for (let i = 0; i < index; i++) {
      if (payments[i].status === 'Completed') previouslyPaid += payments[i].amount;
      if (payments[i].status === 'Refunded') previouslyPaid -= payments[i].amount;
    }
    const balanceDueAfter = booking.grand_total - (previouslyPaid + (p.status === 'Refunded' ? -p.amount : p.amount));
    return generatePaymentReceiptPDF(booking, p, booking.property, booking.customer, settings, previouslyPaid, Math.max(0, balanceDueAfter));
  }

  async function handleViewReceipt(p: any, index: number) {
    if (!settings) return;
    const doc = await getDocForPayment(p, index);
    window.open(URL.createObjectURL(doc.output('blob')));
  }

  async function handleDownloadReceipt(p: any, index: number) {
    if (!settings) return;
    const doc = await getDocForPayment(p, index);
    doc.save(`${p.payment_no}.pdf`);
  }

  const totalPaid = payments.reduce((sum, p) => {
    if (p.status === 'Completed') return sum + Number(p.amount);
    if (p.status === 'Refunded') return sum - Number(p.amount);
    return sum;
  }, 0);
  const balanceDue = Number(booking?.grand_total || 0) - totalPaid;

  async function handleDownloadInvoice() {
    if (!settings || !booking) return;
    try {
      const doc = await generateBookingInvoicePDF(booking, payments, booking.property, booking.customer, settings, totalPaid, Math.max(0, balanceDue));
      doc.save(`INV-${booking.booking_no}.pdf`);
    } catch(err) {
      console.error(err);
      alert('Failed to generate invoice');
    }
  }

  async function handleRefund(p: any) {
    if (!confirm(`Are you sure you want to refund the payment of ${fmtINR(p.amount)}?`)) return;
    try {
      await repository.createPayment({
        payment_no: generateId('REF-'),
        booking_id: booking.id,
        date: new Date().toISOString().split('T')[0],
        amount: p.amount,
        method: p.method,
        ref_id: `Refund for ${p.payment_no}`,
        status: 'Refunded'
      });
      
      const newBalance = balanceDue + p.amount;
      const paymentStatus = newBalance >= booking.grand_total ? 'Unpaid' : (newBalance <= 0 ? 'Fully Paid' : 'Partially Paid');
      await repository.updateBooking(booking.id, { payment_status: paymentStatus });
      
      load();
    } catch(err: any) {
      alert(err.message);
    }
  }

  if (loading && !booking) return <div>Loading booking details...</div>;
  if (!booking) return <div>Booking not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/bookings" className="link-btn">← Back to Bookings</Link>
      </div>
      
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Booking {booking.booking_no}</div>
          <div className="page-sub">{booking.property?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
           <span className="badge" style={{ backgroundColor: balanceDue <= 0 ? '#5F7A57' : '#A63A2E', color: 'white' }}>
             {balanceDue <= 0 ? 'Fully Paid' : balanceDue === Number(booking.grand_total) ? 'Unpaid' : 'Partially Paid'}
           </span>
           <span className="badge" style={{ backgroundColor: '#2C3E50', color: 'white' }}>{booking.booking_status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className="btn btn-outline" onClick={handleDownloadInvoice}><FileText size={16} /> Download Invoice</button>
        <button className="btn btn-outline" onClick={() => handleDemoSend('Email', 'Booking Confirmation')}>Simulate Email Confirmation</button>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">Stay Details</div>
          <p><strong>Check-in:</strong> {fmtDate(booking.check_in)}</p>
          <p><strong>Check-out:</strong> {fmtDate(booking.check_out)}</p>
          <p><strong>Nights:</strong> {booking.nights}</p>
          <p><strong>Guests:</strong> {booking.guests}</p>
          <p><strong>Rooms:</strong> {booking.rooms}</p>
        </div>

        <div className="card">
          <div className="card-head">Customer Details</div>
          <p><strong>Name:</strong> {booking.customer?.name}</p>
          <p><strong>Phone:</strong> {booking.customer?.phone}</p>
          <p><strong>Email:</strong> {booking.customer?.email || '—'}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-head-row">
          <div className="card-head">Financial Summary</div>
          {balanceDue > 0 && (
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>Record Payment</button>
          )}
        </div>
        <p><strong>Grand Total:</strong> {fmtINR(booking.grand_total)}</p>
        <p><strong>Total Paid:</strong> {fmtINR(totalPaid)}</p>
        <p><strong style={{ color: balanceDue > 0 ? '#A63A2E' : '#5F7A57' }}>Balance Due:</strong> {fmtINR(balanceDue)}</p>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-head">Payment Ledger</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payment No</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, index) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.date)}</td>
                  <td className="brand-serif">{p.payment_no}</td>
                  <td>{p.method}</td>
                  <td className="muted">{p.ref_id || '—'}</td>
                  <td className="num">{p.status === 'Refunded' ? `-${fmtINR(p.amount)}` : fmtINR(p.amount)}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: p.status === 'Refunded' ? '#928A78' : '#5F7A57', color: 'white' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {p.status === 'Completed' && <button className="icon-btn" title="Refund Payment" onClick={() => handleRefund(p)}><Undo2 size={16} /></button>}
                      <button className="icon-btn" title="View Receipt" onClick={() => handleViewReceipt(p, index)}><Eye size={16} /></button>
                      <button className="icon-btn" title="Download PDF" onClick={() => handleDownloadReceipt(p, index)}><Download size={16} /></button>
                      <button className="icon-btn" title="Email Receipt" onClick={() => handleDemoSend('Email', 'Payment Receipt')}><Mail size={16} /></button>
                      <button className="icon-btn" title="WhatsApp Receipt" onClick={() => handleDemoSend('WhatsApp', 'Payment Receipt')}><MessageCircle size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={7} className="empty-note">No payments recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-head">Notification Log</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id}>
                    <td>{fmtDate(n.created_at)}</td>
                    <td>{n.channel}</td>
                    <td>{n.type}</td>
                    <td>{n.recipient}</td>
                    <td><span className="badge" style={{ backgroundColor: '#FFF4E5', color: '#B5502F', border: '1px solid #FFE4C4' }}>{n.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <AddPaymentModal 
          booking={booking} 
          balanceDue={balanceDue} 
          previouslyPaid={totalPaid}
          onClose={() => setShowPaymentModal(false)}
          onComplete={() => {
            setShowPaymentModal(false);
            load();
          }} 
        />
      )}
    </div>
  );
}
