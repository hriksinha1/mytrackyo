import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { Plus } from 'lucide-react';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function BookingsList() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bRes, cRes, pRes] = await Promise.all([
          repository.getBookings(propertyFilter),
          repository.getCustomers(),
          repository.getProperties()
        ]);

        const custMap = cRes.reduce((acc: any, c: any) => ({...acc, [c.id]: c}), {});
        const propMap = pRes.reduce((acc: any, p: any) => ({...acc, [p.id]: p}), {});

        const enhanced = bRes.map((b: any) => ({
          ...b,
          customer: custMap[b.customer_id],
          property: propMap[b.property_id]
        }));

        setBookings(enhanced);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Bookings</div>
          <div className="page-sub">{propertyFilter ? 'Filtered reservations' : 'All reservations across properties'}</div>
        </div>
        <Link to="/bookings/new" className="btn btn-primary">
          <Plus size={15} /> New booking
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Customer</th>
                <th>Property</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th className="num">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="brand-serif">
                    <Link to={`/bookings/${b.id}`} className="link-btn">{b.booking_no}</Link>
                  </td>
                  <td>{b.customer?.name}</td>
                  <td>{b.property?.name}</td>
                  <td>{fmtDate(b.check_in)}</td>
                  <td>{fmtDate(b.check_out)}</td>
                  <td className="num">{fmtINR(b.grand_total)}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: b.payment_status === 'Fully Paid' ? '#5F7A57' : '#A63A2E', color: 'white' }}>
                      {b.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={7} className="empty-note">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
