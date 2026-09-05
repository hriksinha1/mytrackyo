import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-sm border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xl">
              HM
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hotel Manager</h2>
              <p className="text-sm text-gray-500">Property Management System</p>
            </div>
          </div>
          
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
              <Sparkles size={16} className="text-amber-600" /> Demo Mode
            </div>
            <p className="text-sm text-amber-700/80 leading-relaxed">
              You are viewing the demonstration version of Hotel Manager. No external backend configuration is required.
            </p>
          </div>

          <button 
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            onClick={onLogin}
          >
            Enter Demo Workspace <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
