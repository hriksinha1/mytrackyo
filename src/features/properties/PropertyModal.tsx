import React, { useState } from 'react';
import { repository } from '../../lib/repository';
import { Property } from '../../lib/repository/types';

export default function PropertyModal({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) {
  const [formData, setFormData] = useState<Omit<Property, 'id' | 'created_at'>>({
    name: '',
    property_type: 'Hotel',
    location: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    check_in_time: '14:00',
    check_out_time: '11:00',
    active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await repository.createProperty(formData);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 600, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-head">Add New Property</div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Property Name</label>
              <input className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            <div>
              <label className="field-label">Property Type</label>
              <select className="select full" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                <option>Hotel</option>
                <option>Resort</option>
                <option>Homestay</option>
                <option>Hostel</option>
                <option>Lodge</option>
              </select>
            </div>
            
            <div>
              <label className="field-label">Location Concept</label>
              <input className="input" placeholder="e.g. City Center, Beachfront" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Full Address</label>
              <input className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>

            <div>
              <label className="field-label">City</label>
              <input className="input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
            </div>
            <div>
              <label className="field-label">State</label>
              <input className="input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
            </div>
            <div>
              <label className="field-label">Pincode</label>
              <input className="input" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required />
            </div>

            <div>
              <label className="field-label">Phone</label>
              <input className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div>
              <label className="field-label">GSTIN (Optional)</label>
              <input className="input" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value})} />
            </div>
          </div>

          {error && <div className="login-err" style={{ marginTop: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
