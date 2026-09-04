import React, { useState, useEffect } from 'react';
import { repository } from '../../lib/repository';
import { generateId, fmtINR, fmtDate } from '../../lib/utils/formatters';
import { generatePaymentReceiptPDF } from '../../lib/services/pdfGenerator';

export default function AddPaymentModal({ booking, balanceDue, previouslyPaid, onClose, onComplete }: { booking: any, balanceDue: number, previouslyPaid: number, onClose: () => void, onComplete: () => void }) {
  const [amount, setAmount] = useState<number | ''>(balanceDue);
  const [method, setMethod] = useState('Google Pay');
  const [refId, setRefId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [successData, setSuccessData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    repository.getSettings().then(setSettings);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const numAmount = Number(amount);
      if (numAmount <= 0) throw new Error('Payment amount must be greater than zero.');
      if (numAmount > balanceDue) throw new Error(`Amount exceeds balance due (${fmtINR(balanceDue)}).`);

      // Duplicate check (rough)
      const existingPayments = await repository.getPayments(booking.id);
      if (refId && existingPayments.some(p => p.ref_id === refId)) {
        throw new Error('This transaction/reference ID is already recorded.');
      }

      const payment = await repository.createPayment({
        payment_no: generateId('REC-'),
        booking_id: booking.id,
        date,
        amount: numAmount,
        method,
        ref_id: refId,
        status: 'Completed'
      });

      // Update booking status based on new balance
      const newBalance = balanceDue - numAmount;
      const paymentStatus = newBalance <= 0 ? 'Fully Paid' : 'Partially Paid';
      
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

  async function handleDemoSend(channel: string) {
    if (!successData) return;
    try {
      await repository.createNotification({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel,
        type: 'Payment Receipt',
        recipient: channel === 'Email' ? booking.customer?.email || 'Unknown' : booking.customer?.phone || 'Unknown',
        status: 'Demo Sent'
      });
      alert(`Demo ${channel} prepared and marked as "Demo Sent".`);
    } catch (err) {
      console.error(err);
    }
  }

  if (successData) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div className="card" style={{ width: 450, maxWidth: '90%' }}>
          <div className="card-head" style={{ color: '#5F7A57' }}>Payment Recorded Successfully</div>
          
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2C3E50' }}>{fmtINR(successData.numAmount)}</div>
            <div className="muted">received via {successData.payment.method}</div>
            {successData.payment.ref_id && <div style={{ fontSize: 13, marginTop: 4 }}>Ref: {successData.payment.ref_id}</div>}
          </div>

          <div style={{ background: '#F8F9FA', padding: 16, borderRadius: 6, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="muted">Booking Total</span>
              <strong>{fmtINR(booking.grand_total)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="muted">Total Paid</span>
              <strong>{fmtINR(booking.grand_total - successData.newBalance)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
              <span className="muted">Balance Due</span>
              <strong style={{ color: successData.newBalance > 0 ? '#A63A2E' : '#5F7A57' }}>{fmtINR(successData.newBalance)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <button className="btn btn-outline" onClick={async () => {
              if(!settings) return;
              try {
                const doc = await generatePaymentReceiptPDF(booking, successData.payment, booking.property, booking.customer, settings, previouslyPaid, successData.newBalance);
                window.open(URL.createObjectURL(doc.output('blob')));
              } catch(err) { console.error(err); }
            }}>View Receipt</button>
            <button className="btn btn-outline" onClick={handleDownloadPDF}>Download PDF</button>
            <button className="btn btn-outline" onClick={() => handleDemoSend('Email')}>Email Receipt</button>
            <button className="btn btn-outline" onClick={() => handleDemoSend('WhatsApp')}>WhatsApp Receipt</button>
          </div>

          <button className="btn btn-primary full" onClick={onComplete}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 400, maxWidth: '90%' }}>
        <div className="card-head">Record Payment</div>
        
        <div style={{ marginBottom: 16, background: '#F8F9FA', padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 13, color: '#666' }}>Booking {booking.booking_no}</div>
          <div style={{ fontWeight: 600 }}>Balance Due: {fmtINR(balanceDue)}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="field-label">Amount (₹)</label>
              <input type="number" className="input" value={amount} onChange={e => setAmount(Number(e.target.value) || '')} required max={balanceDue} step="0.01" />
            </div>
            
            <div>
              <label className="field-label">Method</label>
              <select className="select full" value={method} onChange={e => setMethod(e.target.value)}>
                <option>Google Pay</option>
                <option>PhonePe</option>
                <option>Paytm</option>
                <option>WhatsApp Pay</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label className="field-label">Reference ID (Optional)</label>
              <input className="input" value={refId} onChange={e => setRefId(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Payment Date</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          {error && <div className="login-err" style={{ marginTop: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
