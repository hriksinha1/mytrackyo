import React, { useEffect, useState } from 'react';
import { repository } from '../../lib/repository';
import { RotateCcw } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    repository.getSettings().then(setSettings);
  }, []);

  async function handleReset() {
    if (confirm("WARNING: This will wipe all current demo data and restore the initial seed state (properties, bookings, customers). Are you sure?")) {
      await repository.resetDemoData();
      alert("Demo data has been reset to its original state.");
      window.location.reload();
    }
  }

  if (!settings) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Settings</div>
          <div className="page-sub">Global configuration</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-head">Business Identity</div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="field-label">Display Name</label>
            <input className="input" value={settings.name} disabled />
          </div>
          <div>
            <label className="field-label">Legal Name</label>
            <input className="input" value={settings.legalName} disabled />
          </div>
          <div>
            <label className="field-label">GSTIN</label>
            <input className="input" value={settings.gstin} disabled />
          </div>
        </div>
        <div className="muted small-note" style={{ marginTop: 12 }}>
          (These settings are read-only in the Demo Mode)
        </div>
      </div>

      <div className="card" style={{ borderColor: '#A63A2E' }}>
        <div className="card-head" style={{ color: '#A63A2E' }}>Demo Controls</div>
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Reset the demo database back to its original seeded state. This will erase all new bookings, payments, and customers you have added during this session.
        </p>
        <button className="btn btn-outline" style={{ borderColor: '#A63A2E', color: '#A63A2E' }} onClick={handleReset}>
          <RotateCcw size={16} /> Reset Demo Data
        </button>
      </div>
    </div>
  );
}
