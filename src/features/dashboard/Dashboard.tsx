import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { CalendarDays, Wallet, TrendingUp, CheckCircle, Clock, Plus, ArrowUpRight, BedDouble, AlertCircle } from 'lucide-react';
import { fmtINR, fmtDate } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [stats, setStats] = useState({ bookings: 0, revenue: 0, outstanding: 0, todayBookings: 0, checkIns: 0, fullyPaid: 0, partiallyPaid: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const bookings = await repository.getBookings(propertyFilter);
        const payments = await repository.getAllPayments(propertyFilter);
        const properties = await repository.getProperties();
        
        let revenue = 0;
        let outstanding = 0;
        let todayBookings = 0;
        let checkIns = 0;
        let fullyPaid = 0;
        let partiallyPaid = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        
        revenue = payments.filter(p => p.status === 'Completed' || p.status === 'Recorded').reduce((sum, p) => sum + Number(p.amount), 0);
        const totalGrand = bookings.reduce((sum, b) => sum + Number(b.grand_total), 0);
        outstanding = totalGrand - revenue;
        
        bookings.forEach(b => {
           if (b.created_at.startsWith(todayStr)) todayBookings++;
           if (b.check_in === todayStr) checkIns++;
           if (b.payment_status === 'Fully Paid' || b.payment_status === 'Paid') fullyPaid++;
           if (b.payment_status === 'Partially Paid') partiallyPaid++;
        });

        // Enqueue property data formatting
        const enrichedBookings = bookings.map(b => {
          const prop = properties.find(p => p.id === b.property_id);
          return { ...b, property: prop };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        
        setStats({ bookings: bookings.length, revenue, outstanding: Math.max(0, outstanding), todayBookings, checkIns, fullyPaid, partiallyPaid });
        setRecentBookings(enrichedBookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white border border-gray-100 rounded-xl shadow-sm"></div>)}
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 8900 },
    { name: 'Sat', revenue: 12000 },
    { name: 'Sun', revenue: 10000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Good morning, Owner</h1>
          <p className="text-sm text-gray-500 mt-1">
            {propertyFilter ? 'Here is the overview for your selected property.' : 'Here is what is happening across all your properties today.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white">
            <option>Today</option>
            <option>This week</option>
            <option>This month</option>
          </select>
          <Link to="/bookings/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="p-2 bg-gray-50 rounded-lg"><TrendingUp size={16} className="text-gray-700" /></div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">{fmtINR(stats.revenue)}</div>
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight size={12} /> 12.5% vs last month
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-sm font-medium text-gray-500">Total Bookings</div>
            <div className="p-2 bg-gray-50 rounded-lg"><CalendarDays size={16} className="text-gray-700" /></div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">{stats.bookings}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.todayBookings} new today</div>
          </div>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-sm font-medium text-gray-500">Outstanding Due</div>
            <div className="p-2 bg-amber-50 rounded-lg"><Wallet size={16} className="text-amber-600" /></div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">{fmtINR(stats.outstanding)}</div>
            <div className="text-xs text-gray-500 mt-1">From {stats.bookings - stats.fullyPaid} bookings</div>
          </div>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-sm font-medium text-gray-500">Check-ins Today</div>
            <div className="p-2 bg-gray-50 rounded-lg"><BedDouble size={16} className="text-gray-700" /></div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">{stats.checkIns}</div>
            <div className="text-xs text-gray-500 mt-1">Requires attention</div>
          </div>
        </div>
      </div>
      
      {/* Charts and Tables Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="revenue" fill="#111827" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Needs Attention</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-900">{stats.bookings - stats.fullyPaid} bookings have outstanding payments</div>
                  <Link to="/outstanding" className="text-xs text-amber-700 mt-1 hover:underline">View outstanding ledger</Link>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <BedDouble size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-blue-900">{stats.checkIns} guests checking in today</div>
                  <Link to="/bookings" className="text-xs text-blue-700 mt-1 hover:underline">View all bookings</Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Paid</span>
                  <span className="font-medium text-gray-900">{stats.fullyPaid}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Partially Paid</span>
                  <span className="font-medium text-gray-900">{stats.partiallyPaid}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Unpaid</span>
                  <span className="font-medium text-gray-900">{stats.bookings - (stats.fullyPaid + stats.partiallyPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Bookings Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="text-base font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Booking Ref</th>
                <th className="px-6 py-3 font-medium">Property</th>
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-right">Due</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recentBookings.map(b => {
                const totalPaid = b.grand_total; // need to fetch payments per booking ideally, but for demo UI we use payment_status
                const isPaid = b.payment_status === 'Paid' || b.payment_status === 'Fully Paid';
                const isPartial = b.payment_status === 'Partially Paid';
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => window.location.href=`/bookings/${b.id}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{b.booking_no}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.property?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {fmtDate(b.check_in)} – {fmtDate(b.check_out)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">{fmtINR(b.grand_total)}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-medium">
                      {isPaid ? <span className="text-gray-400">₹0</span> : <span className="text-red-600">{/* Due amount calculation would go here if fetched, fallback to text */}—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isPaid ? 'bg-green-100 text-green-700' : 
                        isPartial ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {b.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No bookings found. <Link to="/bookings/new" className="text-indigo-600 font-medium">Create one</Link> to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
