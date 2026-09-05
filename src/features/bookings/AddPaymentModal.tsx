import React, { useState, useEffect } from 'react';
import { repository } from '../../lib/repository';
import { generateId, fmtINR } from '../../lib/utils/formatters';
import { generatePaymentReceiptPDF } from '../../lib/services/pdfGenerator';
import { X, CheckCircle, Download, FileText, Mail, MessageCircle, AlertCircle } from 'lucide-react';

export default function AddPaymentModal({ 
  booking, 
  balanceDue, 
  onClose, 
  onSuccess 
}: { 
  booking: any, 
  balanceDue: number, 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [amount, setAmount] = useState<number | ''>(balanceDue);
  const [method, setMethod] = useState('Google Pay');
  const [refId, setRefId] = useState('');
  const [purpose, setPurpose] = useState('Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [previouslyPaid, setPreviouslyPaid] = useState<number>(0);

  useEffect(() => {
    repository.getSettings().then(setSettings);
    repository.getPayments(booking.id).then(payments => {
        const total = payments.reduce((sum, p) => {
            if (p.status === 'Completed' || p.status === 'Recorded') return sum + Number(p.amount);
            if (p.status === 'Refunded') return sum - Number(p.amount);
            return sum;
        }, 0);
        setPreviouslyPaid(total);
    });
  }, [booking.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const numAmount = Number(amount);
      if (numAmount <= 0) throw new Error('Payment amount must be greater than zero.');
      if (numAmount > balanceDue) throw new Error(`Amount exceeds balance due (${fmtINR(balanceDue)}).`);
      
      const payment = await repository.createPayment({
        payment_no: generateId('REC-'),
        booking_id: booking.id,
        date,
        amount: numAmount,
        method,
        purpose,
        ref_id: refId,
        status: 'Recorded'
      });

      const newBalance = balanceDue - numAmount;
      const paymentStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
      
      await repository.updateBooking(booking.id, { payment_status: paymentStatus });
      setSuccessData({ payment, numAmount, newBalance });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!successData || !settings) return;
    try {
      const doc = await generatePaymentReceiptPDF(
        booking,
        successData.payment,
        booking.property,
        booking.customer,
        settings,
        previouslyPaid,
        successData.newBalance
      );
      doc.save(`${successData.payment.payment_no}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    }
  }

  const handleDemoSend = (channel: string) => {
    alert(`Demo Mode: Simulated sending Payment Receipt via ${channel}.`);
  };

  if (successData) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="flex flex-col items-center pt-8 pb-6 px-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Recorded</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 my-2">{fmtINR(successData.numAmount)}</div>
              <div className="text-sm text-gray-500">received via {successData.payment.method}</div>
              {successData.payment.ref_id && (
                <div className="text-xs text-gray-400 mt-1">Ref: {successData.payment.ref_id}</div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-500">Booking Total</span>
              <span className="font-medium text-gray-900">{fmtINR(booking.grand_total)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-gray-900">{fmtINR(booking.grand_total - successData.newBalance)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-600 font-medium">Balance Due</span>
              <span className={`font-bold ${successData.newBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {fmtINR(successData.newBalance)}
              </span>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={handleDownloadPDF}>
              <Download size={16} className="text-gray-400" /> Download PDF
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={async () => {
              if(!settings) return;
              try {
                const doc = await generatePaymentReceiptPDF(booking, successData.payment, booking.property, booking.customer, settings, previouslyPaid, successData.newBalance);
                window.open(URL.createObjectURL(doc.output('blob')));
              } catch(err) { console.error(err); }
            }}>
              <FileText size={16} className="text-gray-400" /> View Receipt
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => handleDemoSend('Email')}>
              <Mail size={16} className="text-gray-400" /> Email
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => handleDemoSend('WhatsApp')}>
              <MessageCircle size={16} className="text-gray-400" /> WhatsApp
            </button>
            <button className="col-span-2 mt-2 w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors" onClick={onSuccess}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Booking {booking.booking_no}</div>
              <div className="text-sm font-medium text-gray-900">Total: {fmtINR(booking.grand_total)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-gray-500 mb-1">Amount Due</div>
              <div className="text-lg font-bold text-gray-900">{fmtINR(balanceDue)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-shadow"
                value={amount} 
                onChange={e => setAmount(Number(e.target.value) || '')} 
                required 
                max={balanceDue} 
                step="0.01" 
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-shadow bg-white"
                value={method} 
                onChange={e => setMethod(e.target.value)}
              >
                <option>Google Pay</option>
                <option>PhonePe</option>
                <option>Paytm</option>
                <option>WhatsApp Pay</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction / Reference ID <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input 
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-shadow"
                value={refId} 
                onChange={e => setRefId(e.target.value)}
                placeholder="e.g. UTR number, Receipt number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Purpose</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-shadow bg-white"
                  value={purpose} 
                  onChange={e => setPurpose(e.target.value)}
                >
                  <option value="Advance">Advance</option>
                  <option value="During stay">During stay</option>
                  <option value="Final payment">Final payment</option>
                  <option value="Payment">Other Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-shadow"
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mt-8 flex gap-3">
            <button 
              type="button" 
              className="flex-1 py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
