import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { generateId, fmtINR } from '../../lib/utils/formatters';
import { AppContextType } from '../../components/layout/AppShell';
import { ChevronRight, ArrowLeft, CheckCircle, UserPlus, Users, MapPin, CreditCard } from 'lucide-react';

export default function NewBooking() {
  const navigate = useNavigate();
  const { propertyFilter } = useOutletContext<AppContextType>();
  
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Step 1: Stay
  const [propertyId, setPropertyId] = useState(propertyFilter);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [roomType, setRoomType] = useState('Standard');
  const [nights, setNights] = useState(0);

  // Step 2: Customer
  const [newCustomer, setNewCustomer] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Step 3: Pricing
  const [baseAmount, setBaseAmount] = useState<number | ''>('');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(12);
  const [discount, setDiscount] = useState<number | ''>(0);

  // Step 4: Payment
  const [paymentType, setPaymentType] = useState('No payment'); // 'No payment', 'Advance payment', 'Full payment'
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Google Pay');
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => {
    Promise.all([repository.getProperties(), repository.getCustomers()]).then(([pRes, cRes]) => {
      const activeProps = pRes.filter(p => p.active);
      setProperties(activeProps);
      setCustomers(cRes);
      if (!propertyId && activeProps.length > 0) {
        setPropertyId(activeProps[0].id);
      }
    });
  }, [propertyId]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
    } else {
      setNights(0);
    }
  }, [checkIn, checkOut]);

  // Derived Calculations
  const numBase = Number(baseAmount) || 0;
  const numDiscount = Number(discount) || 0;
  const subtotal = numBase - numDiscount;
  const taxAmount = taxEnabled ? subtotal * (taxRate / 100) : 0;
  const grandTotal = subtotal + taxAmount;
  
  useEffect(() => {
    if (paymentType === 'Full payment') {
        setPaymentAmount(grandTotal);
    } else if (paymentType === 'No payment') {
        setPaymentAmount('');
    }
  }, [paymentType, grandTotal]);

  const numPayment = Number(paymentAmount) || 0;
  const balanceDue = grandTotal - numPayment;

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!propertyId || !checkIn || !checkOut || nights <= 0) {
        setError('Please select property and valid dates.');
        return;
      }
    } else if (step === 2) {
      if (!newCustomer && !customerId) {
        setError('Please select a guest.');
        return;
      }
      if (newCustomer && (!customerName || !customerPhone)) {
        setError('Name and phone are required for new guests.');
        return;
      }
    } else if (step === 3) {
      if (numBase <= 0) {
        setError('Please enter valid accommodation charges.');
        return;
      }
    }
    setStep(s => s + 1);
  };

  async function handleSubmit() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (paymentType !== 'No payment' && numPayment <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      let finalCustomerId = customerId;
      if (newCustomer) {
        const nc = await repository.createCustomer({
          name: customerName,
          phone: customerPhone,
          email: customerEmail
        });
        finalCustomerId = nc.id;
      }

      const bookingStatus = 'Confirmed';
      const paymentStatus = balanceDue <= 0 ? 'Paid' : (numPayment > 0 ? 'Partially Paid' : 'Unpaid');

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
        base_amount: numBase,
        tax_enabled: taxEnabled,
        tax_rate: taxEnabled ? taxRate : 0,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        booking_status: bookingStatus,
        payment_status: paymentStatus
      });

      if (paymentType !== 'No payment' && numPayment > 0) {
        await repository.createPayment({
          payment_no: generateId('REC-'),
          booking_id: newBooking.id,
          date: new Date().toISOString().split('T')[0],
          amount: numPayment,
          method: paymentMethod,
          purpose: paymentType === 'Advance payment' ? 'Advance' : 'Final payment',
          ref_id: paymentRef,
          status: 'Recorded'
        });
      }

      setCreatedBookingId(newBooking.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (createdBookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed</h2>
          <p className="text-gray-500 mb-8">The reservation has been created successfully.</p>
          <div className="space-y-3">
            <button className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors" onClick={() => navigate(`/bookings/${createdBookingId}`)}>
              View Booking Details
            </button>
            <button className="w-full py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors" onClick={() => navigate('/bookings')}>
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link to="/bookings" className="hover:text-gray-900 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">New Booking</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Booking</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Step 1 */}
          <div className={`bg-white rounded-xl border transition-all ${step === 1 ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 shadow-sm opacity-60'}`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => setStep(1)}>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
                Property & Stay
              </h2>
              {step > 1 && <span className="text-sm text-indigo-600 font-medium">Edit</span>}
            </div>
            {step === 1 && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    <select className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                  </div>
                </div>
                {nights > 0 && <div className="text-sm text-gray-500 font-medium">{nights} night(s) selected</div>}
                
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                    <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={rooms} onChange={e => setRooms(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={guests} onChange={e => setGuests(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" value={roomType} onChange={e => setRoomType(e.target.value)}>
                      <option>Standard</option>
                      <option>Deluxe</option>
                      <option>Suite</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors" onClick={handleNext}>Continue</button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className={`bg-white rounded-xl border transition-all ${step === 2 ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 shadow-sm opacity-60'}`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => step > 1 && setStep(2)}>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                Customer
              </h2>
              {step > 2 && <span className="text-sm text-indigo-600 font-medium">Edit</span>}
            </div>
            {step === 2 && (
              <div className="p-5 space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg w-full max-w-sm mb-4">
                  <button type="button" className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${!newCustomer ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setNewCustomer(false)}>Existing</button>
                  <button type="button" className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${newCustomer ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setNewCustomer(true)}>New Guest</button>
                </div>

                {!newCustomer ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Guest</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                      <option value="">-- Select --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                        <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors" onClick={handleNext}>Continue</button>
                </div>
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className={`bg-white rounded-xl border transition-all ${step === 3 ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 shadow-sm opacity-60'}`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => step > 2 && setStep(3)}>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
                Pricing
              </h2>
              {step > 3 && <span className="text-sm text-indigo-600 font-medium">Edit</span>}
            </div>
            {step === 3 && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Charges (₹)</label>
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={baseAmount} onChange={e => setBaseAmount(Number(e.target.value) || '')} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹) <span className="text-gray-400 font-normal">Optional</span></label>
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={discount} onChange={e => setDiscount(Number(e.target.value) || '')} min="0" />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={taxEnabled} onChange={e => setTaxEnabled(e.target.checked)} />
                    Apply GST
                  </label>
                  {taxEnabled && (
                    <select className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  )}
                </div>
                
                <div className="pt-2">
                  <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors" onClick={handleNext}>Continue</button>
                </div>
              </div>
            )}
          </div>

          {/* Step 4 */}
          <div className={`bg-white rounded-xl border transition-all ${step === 4 ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 shadow-sm opacity-60'}`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => step > 3 && setStep(4)}>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step === 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>4</span>
                Payment
              </h2>
            </div>
            {step === 4 && (
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500 mb-2">Optional. You can record more payments later from this booking.</p>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full mb-4">
                  {['No payment', 'Advance payment', 'Full payment'].map(t => (
                    <button key={t} type="button" className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${paymentType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setPaymentType(t)}>
                      {t}
                    </button>
                  ))}
                </div>

                {paymentType !== 'No payment' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value) || '')} min="0" max={grandTotal} disabled={paymentType === 'Full payment'} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                          <option>Google Pay</option>
                          <option>PhonePe</option>
                          <option>Paytm</option>
                          <option>WhatsApp Pay</option>
                          <option>Cash</option>
                          <option>Card</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID <span className="text-gray-400 font-normal">Optional</span></label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
        </div>

        {/* Right column: Summary */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden text-white sticky top-24">
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-base font-semibold">Booking Summary</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1 pb-4 border-b border-gray-800">
                <div className="text-sm text-gray-400">Property</div>
                <div className="font-medium">{properties.find(p => p.id === propertyId)?.name || 'Not selected'}</div>
              </div>
              <div className="space-y-1 pb-4 border-b border-gray-800">
                <div className="text-sm text-gray-400">Stay</div>
                <div className="font-medium">{nights > 0 ? `${nights} nights, ${guests} guests` : 'Dates not set'}</div>
                <div className="text-sm text-gray-300">{roomType} Room</div>
              </div>
              
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>{fmtINR(subtotal)}</span>
                </div>
                {taxEnabled && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>GST ({taxRate}%)</span>
                    <span>{fmtINR(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-800 mt-2">
                  <span>Total Booking Amount</span>
                  <span>{fmtINR(grandTotal)}</span>
                </div>
              </div>

              {step === 4 && (
                <div className="bg-gray-800 rounded-lg p-4 mt-4">
                  <div className="flex justify-between text-sm mb-1 text-gray-300">
                    <span>Payment</span>
                    <span className="text-green-400">{fmtINR(numPayment)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Due</span>
                    <span className={balanceDue > 0 ? 'text-amber-400' : 'text-gray-400'}>{fmtINR(balanceDue)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 pt-0">
              <button 
                type="button" 
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-gray-700" 
                onClick={handleSubmit}
                disabled={loading || step < 4}
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
