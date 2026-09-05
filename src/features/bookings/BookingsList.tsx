import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { Plus, Search, Filter, CalendarDays } from 'lucide-react';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function BookingsList() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setBookings(enhanced);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  const filteredBookings = bookings.filter(b => 
    b.booking_no.toLowerCase().includes(search.toLowerCase()) ||
    b.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">{propertyFilter ? 'Manage reservations for the selected property.' : 'Manage all reservations across your properties.'}</p>
        </div>
        <div>
          <Link to="/bookings/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center gap-4 flex-wrap">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search by booking # or guest name..." 
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm bg-gray-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Booking</th>
                <th className="px-6 py-3 font-medium">Guest</th>
                <th className="px-6 py-3 font-medium">Property</th>
                <th className="px-6 py-3 font-medium">Stay Dates</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBookings.map(b => {
                const isPaid = b.payment_status === 'Paid' || b.payment_status === 'Fully Paid';
                const isPartial = b.payment_status === 'Partially Paid';
                
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate(`/bookings/${b.id}`)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{b.booking_no}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{b.customer?.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.property?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {fmtDate(b.check_in)} – {fmtDate(b.check_out)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">
                      {fmtINR(b.grand_total)}
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
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2"><CalendarDays size={32} className="mx-auto" /></div>
                    <div className="text-gray-900 font-medium">No bookings found</div>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or create a new booking.</p>
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
