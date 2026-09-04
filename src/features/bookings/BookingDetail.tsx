import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import AddPaymentModal from './AddPaymentModal';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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

        setBooking({ ...bData, customer: cData, property: propData });
        setPayments(pData || []);
        setNotifications(nData || []);
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

  if (loading && !booking) return <div>Loading booking details...</div>;
  if (!booking) return <div>Booking not found.</div>;

  const totalPaid = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = Number(booking.grand_total) - totalPaid;

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
        <div>
           <span className="badge" style={{ backgroundColor: balanceDue <= 0 ? '#5F7A57' : '#A63A2E', color: 'white', marginRight: 8 }}>
             {balanceDue <= 0 ? 'Fully Paid' : balanceDue === Number(booking.grand_total) ? 'Unpaid' : 'Partially Paid'}
           </span>
           <span className="badge" style={{ backgroundColor: '#2C3E50', color: 'white' }}>{booking.booking_status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className="btn btn-outline" onClick={() => handleDemoSend('Email', 'Booking Confirmation')}>Simulate Email Confirmation</button>
        <button className="btn btn-outline" onClick={() => handleDemoSend('WhatsApp', 'Payment Receipt')}>Simulate WhatsApp Receipt</button>
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
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{fmtDate(p.date)}</td>
                  <td className="brand-serif">{p.payment_no}</td>
                  <td>{p.method}</td>
                  <td className="muted">{p.ref_id || '—'}</td>
                  <td className="num">{fmtINR(p.amount)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={6} className="empty-note">No payments recorded yet.</td></tr>}
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
