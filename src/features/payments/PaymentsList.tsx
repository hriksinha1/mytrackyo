import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';
import { Search, Filter, CreditCard, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function PaymentsList() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, bRes, cRes, propRes] = await Promise.all([
          repository.getAllPayments(propertyFilter),
          repository.getBookings(),
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
        })).sort((a: any, b: any) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
        
        setPayments(mappedPayments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter]);

  const filteredPayments = payments.filter(p => 
    p.payment_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.booking?.booking_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.booking?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.ref_id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = filteredPayments.filter(p => p.status === 'Completed' || p.status === 'Recorded').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = filteredPayments.filter(p => p.status === 'Refunded').reduce((sum, p) => sum + Number(p.amount), 0);

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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            {propertyFilter ? 'Filtered payment transactions for the selected property.' : 'All payment transactions across properties.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500">Collected in View</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{fmtINR(totalCollected)}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg"><ArrowDownRight size={24} className="text-green-600" /></div>
        </div>
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500">Refunded in View</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{fmtINR(totalRefunded)}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg"><ArrowUpRight size={24} className="text-gray-600" /></div>
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
              placeholder="Search by receipt, booking or guest..." 
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
                <th className="px-6 py-3 font-medium">Receipt No</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Booking / Guest</th>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{p.payment_no}</div>
                    {p.ref_id && <div className="text-xs text-gray-500 mt-0.5">Ref: {p.ref_id}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {fmtDate(p.date)}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/bookings/${p.booking?.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                      {p.booking?.booking_no}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">{p.booking?.customer?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.method}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">
                    {p.status === 'Refunded' ? `-${fmtINR(p.amount)}` : fmtINR(p.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'Completed' || p.status === 'Recorded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2"><CreditCard size={32} className="mx-auto" /></div>
                    <div className="text-gray-900 font-medium">No payments found</div>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters.</p>
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
