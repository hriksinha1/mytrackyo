import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, CalendarDays, Users, Building, CreditCard, Settings as SettingsIcon, LogOut, BarChart, Bell, Search, MapPin } from 'lucide-react';
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
              HM
            </div>
            <div className="font-semibold text-lg tracking-tight">Hotel Manager</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`} end>
            <Home size={18} /> Dashboard
          </NavLink>
          <NavLink to="/bookings" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`}>
            <CalendarDays size={18} /> Bookings
          </NavLink>
          <NavLink to="/payments" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`}>
            <CreditCard size={18} /> Payments
          </NavLink>
          <NavLink to="/customers" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`}>
            <Users size={18} /> Customers
          </NavLink>
          <NavLink to="/properties" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`}>
            <Building size={18} /> Properties
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`}>
            <BarChart size={18} /> Reports
          </NavLink>
          
          <div className="pt-4 mt-4 border-t border-gray-100"></div>
          
          <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900 [&>svg]:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&>svg]:text-gray-400 [&:hover>svg]:text-gray-600'}`}>
            <SettingsIcon size={18} /> Settings
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={onLogout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <select 
                className="block w-64 pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-gray-900 focus:border-gray-900 bg-gray-50 font-medium text-gray-900 cursor-pointer appearance-none hover:bg-gray-100 transition-colors"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                value={propertyFilter} 
                onChange={e => setPropertyFilter(e.target.value)}
              >
                <option value="">All Properties</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="relative max-w-md w-full hidden lg:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input type="text" placeholder="Search bookings, customers..." className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm bg-gray-50" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              DEMO MODE
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              JS
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <Outlet context={{ propertyFilter }} />
          </div>
        </main>
      </div>
    </div>
  );
}
