import React, { useEffect, useState } from 'react';
import { repository } from '../../lib/repository';
import { Plus } from 'lucide-react';
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
      alert('Property status updated. Please refresh to update global filter.');
    }
  }

  if (loading && properties.length === 0) return <div>Loading properties...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Properties</div>
          <div className="page-sub">Manage your portfolio</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Property
        </button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Property Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>City</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.property_type}</td>
                  <td>{p.location}</td>
                  <td>{p.city}, {p.state}</td>
                  <td>
                    {p.phone}<br/>
                    <span className="muted small-note">{p.email}</span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: p.active ? '#E8F5E9' : '#F5F5F5', color: p.active ? '#2E7D32' : '#666', border: '1px solid currentColor' }}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => handleToggleStatus(p.id, p.active)}>
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && <tr><td colSpan={7} className="empty-note">No properties found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <PropertyModal 
          onClose={() => setShowAdd(false)}
          onComplete={() => {
            setShowAdd(false);
            load();
            alert('Property added. Please refresh to update global filter.');
          }}
        />
      )}
    </div>
  );
}
