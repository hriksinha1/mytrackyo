import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { fmtDate, fmtINR, generateId } from '../../lib/utils/formatters';
import { calculateBookingPaymentSummary } from '../../lib/utils/financials';
import AddPaymentModal from './AddPaymentModal';
import { generatePaymentReceiptPDF, generateBookingInvoicePDF } from '../../lib/services/pdfGenerator';
import { Download, Eye, Mail, MessageCircle, FileText, Undo2, ArrowLeft, Building, User, Calendar, CreditCard, ChevronRight } from 'lucide-react';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [bData, pData, sData, cData, propData] = await Promise.all([
        repository.getBooking(id as string),
        repository.getPayments(id as string),
        repository.getSettings(),
        repository.getCustomers(),
        repository.getProperties()
      ]);
      const b = bData;
      if (b) {
        b.customer = cData.find(c => c.id === b.customer_id);
        b.property = propData.find(p => p.id === b.property_id);
      }
      setBooking(b);
      setPayments(pData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setSettings(sData);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDemoSend = (method: string, docType: string) => {
    alert(`Demo Mode: Simulated sending ${docType} via ${method}. In production, this connects to the respective API.`);
  };

  async function getDocForPayment(p: any, index: number) {
    let previouslyPaid = 0;
    for (let i = 0; i < index; i++) {
      if (payments[i].status === 'Completed' || payments[i].status === 'Recorded') previouslyPaid += payments[i].amount;
      if (payments[i].status === 'Refunded') previouslyPaid -= payments[i].amount;
    }
    const balanceDueAfter = booking.grand_total - (previouslyPaid + (p.status === 'Refunded' ? -p.amount : p.amount));
    return generatePaymentReceiptPDF(booking, p, booking.property, booking.customer, settings, previouslyPaid, Math.max(0, balanceDueAfter));
  }

  async function handleViewReceipt(p: any, index: number) {
    if (!settings) return;
    const doc = await getDocForPayment(p, index);
    window.open(URL.createObjectURL(doc.output('blob')));
  }

  async function handleDownloadReceipt(p: any, index: number) {
    if (!settings) return;
    const doc = await getDocForPayment(p, index);
    doc.save(`${p.payment_no}.pdf`);
  }

  const { totalAmount, totalPaid, balanceDue, paymentStatus } = booking && payments ? calculateBookingPaymentSummary(booking, payments) : { totalAmount: 0, totalPaid: 0, balanceDue: 0, paymentStatus: 'Unpaid' };

  async function handleDownloadInvoice() {
    if (!settings || !booking) return;
    try {
      const doc = await generateBookingInvoicePDF(booking, payments, booking.property, booking.customer, settings, totalPaid, Math.max(0, balanceDue));
      doc.save(`INV-${booking.booking_no}.pdf`);
    } catch(err) {
      console.error(err);
      alert('Failed to generate invoice');
    }
  }

  async function handleRefund(p: any) {
    if (!confirm(`Are you sure you want to refund the payment of ${fmtINR(p.amount)}?`)) return;
    try {
      await repository.createPayment({
        payment_no: generateId('REF-'),
        booking_id: booking.id,
        date: new Date().toISOString().split('T')[0],
        amount: p.amount,
        method: p.method,
        ref_id: `Refund for ${p.payment_no}`,
        status: 'Refunded'
      });
      
      const newBalance = balanceDue + p.amount;
      const newPaymentStatus = newBalance >= booking.grand_total ? 'Unpaid' : (newBalance <= 0 ? 'Paid' : 'Partially Paid');
      await repository.updateBooking(booking.id, { payment_status: newPaymentStatus });
      
      load();
    } catch(err: any) {
      alert(err.message);
    }
  }

  if (loading && !booking) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
          <div className="h-64 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
        </div>
      </div>
    );
  }
  
  if (!booking) return <div>Booking not found.</div>;

  const isPaid = paymentStatus === 'Paid';
  const isUnpaid = paymentStatus === 'Unpaid';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link to="/bookings" className="hover:text-gray-900 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{booking.booking_no}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{booking.booking_no}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              {booking.booking_status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPaid ? 'bg-green-100 text-green-700' : 
              isUnpaid ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {paymentStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Building size={14} /> {booking.property?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" onClick={handleDownloadInvoice}>
            <FileText size={16} /> Invoice
          </button>
          {balanceDue > 0 ? (
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors" onClick={() => setShowPayModal(true)}>
              Record Payment
            </button>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200">
              Paid in full
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Calendar size={18} className="text-gray-400" /> Stay Details</h2>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Check-in</div>
                <div className="font-medium text-gray-900">{fmtDate(booking.check_in)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Check-out</div>
                <div className="font-medium text-gray-900">{fmtDate(booking.check_out)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Nights</div>
                <div className="font-medium text-gray-900">{booking.nights}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Rooms</div>
                <div className="font-medium text-gray-900">{booking.rooms}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Guests</div>
                <div className="font-medium text-gray-900">{booking.guests}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 mb-1">Room Type</div>
                <div className="font-medium text-gray-900">{booking.room_type || 'Standard'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><User size={18} className="text-gray-400" /> Guest Information</h2>
            </div>
            <div className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {booking.customer?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-base">{booking.customer?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-500 mt-1">{booking.customer?.phone || 'No phone provided'}</div>
                {booking.customer?.email && <div className="text-sm text-gray-500">{booking.customer?.email}</div>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><CreditCard size={18} className="text-gray-400" /> Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium">Method</th>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {payments.map((p, index) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-600">{fmtDate(p.date)}</td>
                      <td className="px-5 py-3 text-gray-900">{p.purpose || 'Payment'}</td>
                      <td className="px-5 py-3 text-gray-600">{p.method}</td>
                      <td className="px-5 py-3 text-gray-500">{p.ref_id || '—'}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-900">
                        {p.status === 'Refunded' ? `-${fmtINR(p.amount)}` : fmtINR(p.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.status === 'Refunded' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {p.status === 'Completed' ? 'Recorded' : p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(p.status === 'Completed' || p.status === 'Recorded') && (
                            <button className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors" title="Refund Payment" onClick={() => handleRefund(p)}>
                              <Undo2 size={16} />
                            </button>
                          )}
                          <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors" title="View Receipt" onClick={() => handleViewReceipt(p, index)}>
                            <Eye size={16} />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors" title="Download PDF" onClick={() => handleDownloadReceipt(p, index)}>
                            <Download size={16} />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors" title="Email Receipt" onClick={() => handleDemoSend('Email', 'Payment Receipt')}>
                            <Mail size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Summary (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-gray-900">
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold">Financial Summary</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Room & Stay Charges</span>
                <span className="font-medium text-gray-900">{fmtINR(booking.base_amount)}</span>
              </div>
              {booking.tax_enabled && (
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Taxes (GST {booking.tax_rate}%)</span>
                  <span className="font-medium text-gray-900">{fmtINR(booking.tax_amount)}</span>
                </div>
              )}
              {booking.discount > 0 && (
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Discount</span>
                  <span className="font-medium text-green-600">-{fmtINR(booking.discount)}</span>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 font-medium">Booking Amount</span>
                  <span className="text-lg font-bold">{fmtINR(booking.grand_total)}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mt-4 border border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="font-medium text-gray-900">{fmtINR(totalPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Amount Due</span>
                  <span className={`text-xl font-bold ${balanceDue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {fmtINR(balanceDue)}
                  </span>
                </div>
              </div>
              
              {balanceDue > 0 && (
                <button 
                  className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors mt-2"
                  onClick={() => setShowPayModal(true)}
                >
                  Record Payment
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent transition-colors" onClick={() => handleDemoSend('Email', 'Booking Confirmation')}>
                <Mail size={16} className="text-gray-400" /> Send Confirmation Email
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent transition-colors" onClick={() => handleDemoSend('WhatsApp', 'Booking Confirmation')}>
                <MessageCircle size={16} className="text-gray-400" /> Send WhatsApp Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPayModal && (
        <AddPaymentModal 
          booking={booking} 
          balanceDue={balanceDue}
          onClose={() => setShowPayModal(false)} 
          onSuccess={() => {
            setShowPayModal(false);
            load();
          }} 
        />
      )}
    </div>
  );
}
