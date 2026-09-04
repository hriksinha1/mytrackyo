import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { CalendarDays, Wallet, TrendingUp } from 'lucide-react';
import { fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function Dashboard() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [stats, setStats] = useState({ bookings: 0, revenue: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const bookings = await repository.getBookings(propertyFilter);
        const payments = await repository.getAllPayments(propertyFilter);
        
        let revenue = 0;
        let outstanding = 0;

        revenue = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + Number(p.amount), 0);
        const totalGrand = bookings.reduce((sum, b) => sum + Number(b.grand_total), 0);
        outstanding = totalGrand - revenue;

        setStats({ bookings: bookings.length, revenue, outstanding: Math.max(0, outstanding) });
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
      </div>
      
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-icon"><CalendarDays size={18} /></div>
          <div>
            <div className="kpi-label">Total Bookings</div>
            <div className="kpi-val">{stats.bookings}</div>
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
    </div>
  );
}
