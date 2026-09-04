import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function OutstandingPayments() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [outstandingBookings, setOutstandingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bRes, pRes, cRes, propRes] = await Promise.all([
          repository.getBookings(propertyFilter),
          repository.getAllPayments(propertyFilter),
          repository.getCustomers(),
          repository.getProperties()
        ]);

        const custMap = cRes.reduce((acc: any, c: any) => ({...acc, [c.id]: c}), {});
        const propMap = propRes.reduce((acc: any, p: any) => ({...acc, [p.id]: p}), {});
        
        const paymentsByBooking = pRes.reduce((acc: any, p: any) => {
          if (p.status === 'Completed') {
            acc[p.booking_id] = (acc[p.booking_id] || 0) + Number(p.amount);
          }
          return acc;
        }, {});

        const outstanding = bRes.filter((b: any) => {
          const paid = paymentsByBooking[b.id] || 0;
          return Number(b.grand_total) > paid;
        }).map((b: any) => {
          const paid = paymentsByBooking[b.id] || 0;
          return {
            ...b,
            customer: custMap[b.customer_id],
            property: propMap[b.property_id],
            paid,
            due: Number(b.grand_total) - paid,
            daysUntilCheckIn: Math.ceil((new Date(b.check_in).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
          };
        }).sort((a, b) => b.due - a.due); // Sort by highest due amount

        setOutstandingBookings(outstanding);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  async function handleSendReminder(b: any) {
    try {
      await repository.createNotification({
        booking_id: b.id,
        customer_id: b.customer_id,
        channel: 'Email',
        type: 'Payment Reminder',
        recipient: b.customer?.email || 'Unknown',
        status: 'Demo Sent'
      });
      alert(`Demo Email Payment Reminder prepared for ${b.customer?.name}.`);
    } catch(err) {
      console.error(err);
    }
  }

  if (loading) return <div>Loading outstanding payments...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Outstanding Payments</div>
          <div className="page-sub">Bookings with remaining balance</div>
        </div>
      </div>
      
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Customer</th>
                <th>Property</th>
                <th>Check-in</th>
                <th className="num">Total</th>
                <th className="num">Paid</th>
                <th className="num">Due</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {outstandingBookings.map(b => (
                <tr key={b.id}>
                  <td className="brand-serif">
                    <Link to={`/bookings/${b.id}`} className="link-btn">{b.booking_no}</Link>
                  </td>
                  <td>{b.customer?.name}</td>
                  <td>{b.property?.name}</td>
                  <td>{fmtDate(b.check_in)} <span className="muted" style={{ fontSize: 11 }}>({b.daysUntilCheckIn > 0 ? `in ${b.daysUntilCheckIn}d` : 'past'})</span></td>
                  <td className="num">{fmtINR(b.grand_total)}</td>
                  <td className="num">{fmtINR(b.paid)}</td>
                  <td className="num" style={{ color: '#A63A2E', fontWeight: 600 }}>{fmtINR(b.due)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link to={`/bookings/${b.id}`} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 11 }}>Record Payment</Link>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleSendReminder(b)}>Reminder</button>
                    </div>
                  </td>
                </tr>
              ))}
              {outstandingBookings.length === 0 && <tr><td colSpan={8} className="empty-note">No outstanding payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
