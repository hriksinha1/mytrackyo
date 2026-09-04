import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { calcNights } from '../../lib/utils/calculations';
import { generateId } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';

export default function NewBooking() {
  const navigate = useNavigate();
  const { propertyFilter } = useOutletContext<AppContextType>();
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [propertyId, setPropertyId] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  const [newCustomer, setNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [roomType, setRoomType] = useState('Standard');
  
  const [baseAmount, setBaseAmount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(18);

  useEffect(() => {
    repository.getProperties().then(docs => {
      const active = docs.filter(p => p.active);
      const filtered = propertyFilter ? active.filter(p => p.id === propertyFilter) : active;
      setProperties(filtered);
      if (filtered.length > 0) setPropertyId(filtered[0].id);
    });
    repository.getCustomers().then(setCustomers);
  }, [propertyFilter]);

  const nights = (checkIn && checkOut) ? calcNights(checkIn, checkOut) : 0;
  const taxAmount = taxEnabled ? (baseAmount * (taxRate / 100)) : 0;
  const grandTotal = baseAmount + taxAmount;

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!checkIn || !checkOut || nights <= 0) throw new Error('Invalid dates selected.');
      if (baseAmount < 0) throw new Error('Base amount cannot be negative.');

      let finalCustomerId = customerId;

      if (newCustomer) {
        if (!customerName || !customerPhone) throw new Error('Customer name and phone are required.');
        const cData = await repository.createCustomer({
          name: customerName, phone: customerPhone, email: customerEmail
        });
        finalCustomerId = cData.id;
      }

      if (!finalCustomerId) throw new Error('Please select or create a customer.');

      const newBooking = await repository.createBooking({
        booking_no: generateId('BK-'),
        customer_id: finalCustomerId,
        property_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        nights,
        rooms,
        guests,
        room_type: roomType,
        base_amount: baseAmount,
        tax_enabled: taxEnabled,
        tax_rate: taxEnabled ? taxRate : 0,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        booking_status: 'Confirmed',
        payment_status: 'Unpaid'
      });

      setCreatedBookingId(newBooking.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (createdBookingId) {
    return (
      <div className="center-screen" style={{ flexDirection: 'column', height: 'auto', padding: '60px 20px' }}>
        <div className="card" style={{ width: 400, maxWidth: '100%', textAlign: 'center' }}>
          <div style={{ color: '#5F7A57', fontSize: 24, marginBottom: 8 }}>Booking Created</div>
          <div className="muted" style={{ marginBottom: 24 }}>The reservation has been confirmed.</div>
          
          <div className="stack">
            <button className="btn btn-primary full" onClick={() => navigate(`/bookings/${createdBookingId}`)}>
              Record Advance Payment
            </button>
            <button className="btn btn-outline full" onClick={() => navigate('/bookings')}>
              Skip Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/bookings" className="link-btn">← Back to Bookings</Link>
      </div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">New Booking</div>
          <div className="page-sub">Create a new reservation</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head">Property & Dates</div>
            <label className="field-label">Property</label>
            <select className="select full" value={propertyId} onChange={e => setPropertyId(e.target.value)} required>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {properties.length === 0 && <div className="login-err" style={{marginTop: 8}}>No active properties available.</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <label className="field-label">Check-in</label>
                <input type="date" className="input" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Check-out</label>
                <input type="date" className="input" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
              </div>
            </div>
            {nights > 0 && <div className="muted small-note" style={{ marginTop: 8 }}>{nights} night(s)</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <label className="field-label">Rooms</label>
                <input type="number" min="1" className="input" value={rooms} onChange={e => setRooms(Number(e.target.value))} required />
              </div>
              <div>
                <label className="field-label">Guests</label>
                <input type="number" min="1" className="input" value={guests} onChange={e => setGuests(Number(e.target.value))} required />
              </div>
              <div>
                <label className="field-label">Room Type</label>
                <select className="select full" value={roomType} onChange={e => setRoomType(e.target.value)}>
                  <option>Standard</option>
                  <option>Deluxe</option>
                  <option>Suite</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head-row">
              <div className="card-head">Customer</div>
              <label className="checkbox-row" style={{ marginTop: 0 }}>
                <input type="checkbox" checked={newCustomer} onChange={e => setNewCustomer(e.target.checked)} />
                New Customer
              </label>
            </div>
            
            {!newCustomer ? (
              <div>
                <label className="field-label">Select Customer</label>
                <select className="select full" value={customerId} onChange={e => setCustomerId(e.target.value)} required={!newCustomer}>
                  <option value="">-- Choose --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="field-label">Name</label>
                  <input className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} required={newCustomer} />
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <input className="input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required={newCustomer} />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input type="email" className="input" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head">Pricing</div>
            
            <label className="field-label">Base Amount (₹)</label>
            <input type="number" className="input" value={baseAmount} onChange={e => setBaseAmount(Number(e.target.value))} required min="0" />
            
            <label className="checkbox-row" style={{ marginTop: 16 }}>
              <input type="checkbox" checked={taxEnabled} onChange={e => setTaxEnabled(e.target.checked)} />
              Apply GST
            </label>
            
            {taxEnabled && (
              <div style={{ marginTop: 8 }}>
                <label className="field-label">Tax Rate (%)</label>
                <select className="select full" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            )}

            <div style={{ marginTop: 24, padding: 16, background: '#F8F9FA', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal</span>
                <span>₹ {baseAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
                <span>Tax {taxEnabled ? `(${taxRate}%)` : ''}</span>
                <span>₹ {taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 18, borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 8 }}>
                <span>Grand Total</span>
                <span>₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && <div className="login-err" style={{ marginTop: 16 }}>{error}</div>}
            
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={loading || properties.length === 0}>
              {loading ? 'Saving...' : 'Create Booking'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
