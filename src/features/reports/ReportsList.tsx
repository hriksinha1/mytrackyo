import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';
import { Filter } from 'lucide-react';

export default function ReportsList() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  const [dateRange, setDateRange] = useState('This Month');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bookings = await repository.getBookings(propertyFilter);
        const payments = await repository.getAllPayments(propertyFilter);

        let bookingValue = 0;
        let amountCollected = 0;
        let refunded = 0;
        const methodMap: Record<string, number> = {};

        bookings.forEach(b => {
          bookingValue += b.grand_total;
        });

        payments.forEach(p => {
          if (p.status === 'Completed') {
            amountCollected += p.amount;
            methodMap[p.method] = (methodMap[p.method] || 0) + p.amount;
          } else if (p.status === 'Refunded') {
            refunded += p.amount;
          }
        });

        const outstanding = Math.max(0, bookingValue - amountCollected);

        setReport({
          bookingValue,
          amountCollected,
          outstanding,
          refunded,
          methods: Object.entries(methodMap).sort((a, b) => b[1] - a[1])
        });
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter, dateRange]);

  if (loading && !report) return <div>Loading reports...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Financial Reports</div>
          <div className="page-sub">Payment methods and balances</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
           <select className="select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
             <option>All Time</option>
             <option>This Month</option>
           </select>
        </div>
      </div>

      {report && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="card kpi-card">
              <div className="kpi-label">Booking Value</div>
              <div className="kpi-val" style={{ fontSize: 24, marginTop: 4 }}>{fmtINR(report.bookingValue)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Amount Collected</div>
              <div className="kpi-val" style={{ fontSize: 24, marginTop: 4, color: '#5F7A57' }}>{fmtINR(report.amountCollected)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Refunded</div>
              <div className="kpi-val" style={{ fontSize: 24, marginTop: 4, color: '#928A78' }}>{fmtINR(report.refunded)}</div>
            </div>
            <div className="card kpi-card" style={{ borderColor: '#A63A2E' }}>
              <div className="kpi-label" style={{ color: '#A63A2E' }}>Outstanding</div>
              <div className="kpi-val" style={{ fontSize: 24, marginTop: 4, color: '#A63A2E' }}>{fmtINR(report.outstanding)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">Collected by Payment Method</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th className="num">Total Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {report.methods.map(([method, amount]: any) => (
                    <tr key={method}>
                      <td>{method}</td>
                      <td className="num">{fmtINR(amount)}</td>
                    </tr>
                  ))}
                  {report.methods.length === 0 && <tr><td colSpan={2} className="empty-note">No payments recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
