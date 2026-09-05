import React, { useEffect, useState } from 'react';
import { repository } from '../../lib/repository';
import { Plus, Building, MapPin, Phone, Mail, MoreVertical } from 'lucide-react';
import PropertyModal from './PropertyModal';

export default function PropertiesList() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    const docs = await repository.getProperties();
    setProperties(docs);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleStatus(id: string, current: boolean) {
    if (confirm(`Are you sure you want to ${current ? 'deactivate' : 'activate'} this property?`)) {
      await repository.updateProperty(id, { active: !current });
      await load();
      alert('Property status updated. To see it in the global filter, please reload the page.');
    }
  }

  if (loading && properties.length === 0) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white border border-gray-100 rounded-xl shadow-sm"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your portfolio of hotels, homestays, and resorts.</p>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={16} /> Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map(p => (
          <div key={p.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${p.active ? 'border-gray-200 hover:border-gray-300' : 'border-gray-200 opacity-60 grayscale'}`}>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">{p.property_type}</span>
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block z-10">
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => handleToggleStatus(p.id, p.active)}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="truncate">{p.location}, {p.city}</span>
                </div>
                {(p.phone || p.email) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <span>{p.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {p.active ? 'Active' : 'Inactive'}
              </span>
              {/* Could link to a specific property dashboard in the future */}
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View details</button>
            </div>
          </div>
        ))}
        {properties.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
            <Building size={32} className="text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No properties added</h3>
            <p className="text-sm text-gray-500 mt-1">Get started by adding your first hotel or homestay.</p>
            <button 
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={16} /> Add Property
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <PropertyModal 
          onClose={() => setShowAdd(false)}
          onComplete={() => {
            setShowAdd(false);
            load();
            alert('Property added successfully! To see it in the top navigation, please reload the page.');
          }}
        />
      )}
    </div>
  );
}
