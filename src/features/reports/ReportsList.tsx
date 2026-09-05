import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';
import { Filter, TrendingUp, IndianRupee, PieChart, Activity, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsList() {
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [dateRange, setDateRange] = useState('All Time');

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
          if (p.status === 'Completed' || p.status === 'Recorded') {
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
          methods: Object.entries(methodMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
        });
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyFilter, dateRange]);

  if (loading && !report) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl shadow-sm"></div>)}
        </div>
        <div className="h-80 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
      </div>
    );
  }

  const COLORS = ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Payment methods, balances, and collection performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm bg-white text-gray-700 font-medium" 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
          >
            <option>All Time</option>
            <option>This Month</option>
            <option>Last Month</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-900"><TrendingUp size={64} /></div>
              <div className="text-sm font-medium text-gray-500 mb-1">Total Booking Value</div>
              <div className="text-3xl font-bold text-gray-900">{fmtINR(report.bookingValue)}</div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-green-600"><IndianRupee size={64} /></div>
              <div className="text-sm font-medium text-gray-500 mb-1">Amount Collected</div>
              <div className="text-3xl font-bold text-green-600">{fmtINR(report.amountCollected)}</div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden bg-amber-50/30">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-600"><Activity size={64} /></div>
              <div className="text-sm font-medium text-amber-800 mb-1">Outstanding Balance</div>
              <div className="text-3xl font-bold text-amber-700">{fmtINR(report.outstanding)}</div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
               <div className="text-sm font-medium text-gray-500 mb-1">Total Refunded</div>
              <div className="text-3xl font-bold text-gray-600">{fmtINR(report.refunded)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <PieChart size={18} className="text-gray-400" />
                  Collection by Method
                </h2>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                {report.methods.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={report.methods}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" tickFormatter={(value) => `₹${value/1000}k`} stroke="#9CA3AF" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#4B5563" fontSize={12} width={100} />
                        <Tooltip 
                          formatter={(value: number) => [fmtINR(value), 'Collected']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {report.methods.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">No collection data available for the selected period.</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  Method Breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-medium">Payment Method</th>
                      <th className="px-6 py-3 font-medium text-right">Total Collected</th>
                      <th className="px-6 py-3 font-medium text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {report.methods.map((m: any, index: number) => {
                      const percentage = report.amountCollected > 0 ? (m.value / report.amountCollected) * 100 : 0;
                      return (
                        <tr key={m.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="font-medium text-gray-900">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-gray-600">
                            {fmtINR(m.value)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                    {report.methods.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                          No payments recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {report.methods.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-900">
                      <tr>
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right tabular-nums">{fmtINR(report.amountCollected)}</td>
                        <td className="px-6 py-4 text-right">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
