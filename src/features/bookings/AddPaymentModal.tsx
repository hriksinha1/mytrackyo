import React, { useState } from 'react';
import { repository } from '../../lib/repository';
import { generateId, fmtINR } from '../../lib/utils/formatters';

export default function AddPaymentModal({ booking, balanceDue, onClose, onComplete }: { booking: any, balanceDue: number, onClose: () => void, onComplete: () => void }) {
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState('Google Pay');
  const [refId, setRefId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const numAmount = Number(amount);
      if (numAmount <= 0) throw new Error('Payment amount must be greater than zero.');
      if (numAmount > balanceDue) throw new Error(`Amount exceeds balance due (${fmtINR(balanceDue)}).`);

      await repository.createPayment({
        payment_no: generateId('PAY-'),
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

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
                <option>WhatsApp Pay</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Card</option>
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
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
