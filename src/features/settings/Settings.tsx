import React, { useEffect, useState } from 'react';
import { repository } from '../../lib/repository';
import { RotateCcw, Building2, ShieldAlert, Key, HelpCircle } from 'lucide-react';

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

  if (!settings) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global configuration and business identity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium text-gray-900">Business Identity</h3>
          <p className="text-sm text-gray-500 mt-1">This information appears on generated payment receipts and invoices.</p>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Organization Profile</div>
                  <div className="text-sm text-gray-500">Read-only in Demo Mode</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" value={settings.name} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" value={settings.legalName} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-mono" value={settings.gstin} disabled />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block w-full border-t border-gray-200 my-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium text-red-600 flex items-center gap-2"><ShieldAlert size={20} /> Demo Controls</h3>
          <p className="text-sm text-gray-500 mt-1">Actions that affect the demonstration database state.</p>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="p-6">
              <h4 className="font-medium text-gray-900 mb-2">Reset Demo Data</h4>
              <p className="text-sm text-gray-600 mb-4">
                This will erase all new bookings, payments, properties, and customers you have added during this session and restore the initial seed state.
              </p>
              <button 
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                onClick={handleReset}
              >
                <RotateCcw size={16} /> Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
