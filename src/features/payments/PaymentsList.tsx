import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function PaymentsList() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, bRes, cRes, propRes] = await Promise.all([
          repository.getAllPayments(propertyFilter),
          repository.getBookings(), // get all since payment booking_id links
          repository.getCustomers(),
          repository.getProperties()
        ]);

        const custMap = cRes.reduce((acc: any, c: any) => ({...acc, [c.id]: c}), {});
        const propMap = propRes.reduce((acc: any, p: any) => ({...acc, [p.id]: p}), {});
        
        const enhancedBookings = bRes.reduce((acc: any, b: any) => {
          acc[b.id] = { ...b, customer: custMap[b.customer_id], property: propMap[b.property_id] };
          return acc;
        }, {});

        const mappedPayments = pRes.map((p: any) => ({
          ...p,
          booking: enhancedBookings[p.booking_id]
        }));

        setPayments(mappedPayments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  if (loading) return <div>Loading payments...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Payments</div>
          <div className="page-sub">{propertyFilter ? 'Filtered transactions' : 'All transactions across properties'}</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Payment No</th>
                <th>Booking</th>
                <th>Property</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Method</th>
                <th className="num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="brand-serif">{p.payment_no}</td>
                  <td>{p.booking?.booking_no}</td>
                  <td>{p.booking?.property?.name}</td>
                  <td>{p.booking?.customer?.name}</td>
                  <td>{fmtDate(p.date)}</td>
                  <td>{p.method}</td>
                  <td className="num">{fmtINR(p.amount)}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: p.status === 'Refunded' ? '#928A78' : '#5F7A57', color: 'white' }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={8} className="empty-note">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
