import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, CalendarDays, Users, Building, CreditCard, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { repository } from '../../lib/repository';

export type AppContextType = {
  propertyFilter: string;
};

export default function AppShell({ onLogout }: { onLogout: () => void }) {
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyFilter, setPropertyFilter] = useState<string>(''); 

  useEffect(() => {
    repository.getProperties().then(res => setProperties(res.filter(p => p.active)));
  }, []);

  return (
    <div className="pms-root">
      <div className="shell">
        <aside className="sidebar">
          <div className="side-brand">
            <div className="login-mark small">HM</div>
            <div className="brand-serif side-brand-name">Hotel Manager</div>
          </div>
          <nav className="side-nav">
            <NavLink to="/" className={({isActive}) => `side-link ${isActive ? 'active' : ''}`} end>
              <Home size={17} /> Dashboard
            </NavLink>
            <NavLink to="/bookings" className={({isActive}) => `side-link ${isActive ? 'active' : ''}`}>
              <CalendarDays size={17} /> Bookings
            </NavLink>
            <NavLink to="/payments" className={({isActive}) => `side-link ${isActive ? 'active' : ''}`}>
              <CreditCard size={17} /> Payments
            </NavLink>
            <NavLink to="/customers" className={({isActive}) => `side-link ${isActive ? 'active' : ''}`}>
              <Users size={17} /> Customers
            </NavLink>
            <NavLink to="/properties" className={({isActive}) => `side-link ${isActive ? 'active' : ''}`}>
              <Building size={17} /> Properties
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `side-link ${isActive ? 'active' : ''}`}>
              <SettingsIcon size={17} /> Settings
            </NavLink>
          </nav>
          <button className="side-link logout" onClick={onLogout}>
            <LogOut size={17} /> Sign out
          </button>
        </aside>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 60, borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>GLOBAL FILTER:</span>
              <div style={{ position: 'relative' }}>
                <select 
                  className="select" 
                  style={{ paddingRight: 32, minWidth: 200, fontWeight: 600 }}
                  value={propertyFilter} 
                  onChange={e => setPropertyFilter(e.target.value)}
                >
                  <option value="">All Properties</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="badge" style={{ backgroundColor: '#FFF4E5', color: '#B5502F', border: '1px solid #FFE4C4', fontWeight: 600, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                DEMO MODE
              </div>
            </div>
          </header>
          
          <main className="main" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="page">
              <Outlet context={{ propertyFilter }} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
