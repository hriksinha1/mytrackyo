import React, { useState } from 'react';
import { repository } from '../../lib/repository';
import { Property } from '../../lib/repository/types';
import { X, Building } from 'lucide-react';

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
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building size={16} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Add New Property</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. The Grand Hotel" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm bg-white" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                  <option>Hotel</option>
                  <option>Resort</option>
                  <option>Homestay</option>
                  <option>Hostel</option>
                  <option>Lodge</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Area</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" placeholder="e.g. City Center, Beachfront" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required placeholder="Street address" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 text-sm uppercase font-mono" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value})} placeholder="22AAAAA0000A1Z5" />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
            <button type="button" className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors" disabled={loading}>
              {loading ? 'Saving...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
