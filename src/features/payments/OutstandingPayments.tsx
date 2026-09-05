import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';
import { Search, AlertCircle, Bell } from 'lucide-react';

export default function OutstandingPayments() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [outstandingBookings, setOutstandingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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
          if (p.status === 'Completed' || p.status === 'Recorded') {
            acc[p.booking_id] = (acc[p.booking_id] || 0) + Number(p.amount);
          } else if (p.status === 'Refunded') {
            acc[p.booking_id] = (acc[p.booking_id] || 0) - Number(p.amount);
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
        }).sort((a, b) => b.due - a.due);
        
        setOutstandingBookings(outstanding);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  async function handleSendReminder(e: React.MouseEvent, b: any) {
    e.stopPropagation();
    try {
      await repository.createNotification({
        booking_id: b.id,
        customer_id: b.customer_id,
        channel: 'Email',
        type: 'Payment Reminder',
        recipient: b.customer?.email || 'Unknown',
        status: 'Demo Sent'
      });
      alert(`Demo Mode: Simulated sending payment reminder email to ${b.customer?.name}.`);
    } catch(err) {
      console.error(err);
    }
  }

  const filtered = outstandingBookings.filter(b => 
    b.booking_no.toLowerCase().includes(search.toLowerCase()) ||
    b.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = filtered.reduce((sum, b) => sum + b.due, 0);

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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Outstanding Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Track and collect remaining balances from partially paid or unpaid bookings.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-amber-800">Total Outstanding Due</div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{fmtINR(totalDue)}</div>
        </div>
        <div className="p-3 bg-amber-100 rounded-lg"><AlertCircle size={24} className="text-amber-700" /></div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search by booking or guest..." 
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm bg-gray-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Booking / Guest</th>
                <th className="px-6 py-3 font-medium">Property</th>
                <th className="px-6 py-3 font-medium">Check-in</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-right">Paid</th>
                <th className="px-6 py-3 font-medium text-right">Due</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate(`/bookings/${b.id}`)}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{b.booking_no}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{b.customer?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{b.property?.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{fmtDate(b.check_in)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{b.daysUntilCheckIn > 0 ? `in ${b.daysUntilCheckIn}d` : 'past date'}</div>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-gray-600">{fmtINR(b.grand_total)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-gray-600">{fmtINR(b.paid)}</td>
                  <td className="px-6 py-4 text-right tabular-nums font-bold text-amber-600">{fmtINR(b.due)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors" title="Send Reminder" onClick={(e) => handleSendReminder(e, b)}>
                        <Bell size={16} />
                      </button>
                      <button className="px-3 py-1.5 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-colors text-xs" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bookings/${b.id}`);
                      }}>
                        Record
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2"><AlertCircle size={32} className="mx-auto" /></div>
                    <div className="text-gray-900 font-medium">No outstanding payments</div>
                    <p className="text-gray-500 text-sm mt-1">All filtered bookings are fully paid.</p>
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
