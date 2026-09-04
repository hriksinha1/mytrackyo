import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { CalendarDays, Wallet, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { fmtINR, fmtDate } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function Dashboard() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [stats, setStats] = useState({ bookings: 0, revenue: 0, outstanding: 0, todayBookings: 0, checkIns: 0, fullyPaid: 0, partiallyPaid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const bookings = await repository.getBookings(propertyFilter);
        const payments = await repository.getAllPayments(propertyFilter);
        
        let revenue = 0;
        let outstanding = 0;
        let todayBookings = 0;
        let checkIns = 0;
        let fullyPaid = 0;
        let partiallyPaid = 0;

        const todayStr = new Date().toISOString().split('T')[0];

        revenue = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + Number(p.amount), 0);
        const totalGrand = bookings.reduce((sum, b) => sum + Number(b.grand_total), 0);
        outstanding = totalGrand - revenue;
        
        bookings.forEach(b => {
           if (b.created_at.startsWith(todayStr)) todayBookings++;
           if (b.check_in === todayStr) checkIns++;
           if (b.payment_status === 'Fully Paid') fullyPaid++;
           if (b.payment_status === 'Partially Paid') partiallyPaid++;
        });

        setStats({ bookings: bookings.length, revenue, outstanding: Math.max(0, outstanding), todayBookings, checkIns, fullyPaid, partiallyPaid });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Dashboard</div>
          <div className="page-sub">{propertyFilter ? 'Filtered property overview' : 'Consolidated overview of all properties'}</div>
        </div>
        <div>
          <Link to="/bookings/new" className="btn btn-primary">New Booking</Link>
        </div>
      </div>
      
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-icon"><CalendarDays size={18} /></div>
          <div>
            <div className="kpi-label">Total Bookings</div>
            <div className="kpi-val">{stats.bookings}</div>
            <div className="kpi-label muted" style={{ marginTop: 4 }}>{stats.todayBookings} today</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon"><TrendingUp size={18} /></div>
          <div>
            <div className="kpi-label">Collected Revenue</div>
            <div className="kpi-val">{fmtINR(stats.revenue)}</div>
          </div>
        </div>
        <div className="card kpi-card" style={{ borderColor: '#A63A2E' }}>
          <div className="kpi-icon"><Wallet size={18} color="#A63A2E" /></div>
          <div>
            <div className="kpi-label" style={{ color: '#A63A2E' }}>Total Outstanding</div>
            <div className="kpi-val" style={{ color: '#A63A2E' }}>{fmtINR(stats.outstanding)}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
         <div className="card">
           <div className="card-head">Today's Activity</div>
           <div className="mini-row">
             <div className="mini-row-title">Today's New Bookings</div>
             <div>{stats.todayBookings}</div>
           </div>
           <div className="mini-row">
             <div className="mini-row-title">Today's Check-ins</div>
             <div>{stats.checkIns}</div>
           </div>
         </div>
         <div className="card">
           <div className="card-head">Payment Status Summary</div>
           <div className="mini-row">
             <div className="mini-row-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} color="#5F7A57" /> Fully Paid</div>
             <div>{stats.fullyPaid}</div>
           </div>
           <div className="mini-row">
             <div className="mini-row-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="#B8862E" /> Partially Paid</div>
             <div>{stats.partiallyPaid}</div>
           </div>
           <div className="mini-row">
             <div className="mini-row-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={14} color="#A63A2E" /> Unpaid</div>
             <div>{stats.bookings - (stats.fullyPaid + stats.partiallyPaid)}</div>
           </div>
         </div>
      </div>
    </div>
  );
}
