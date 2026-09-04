import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="login-wrap">
      <div className="login-card" style={{ maxWidth: 420 }}>
        <div className="login-brand" style={{ marginBottom: 32 }}>
          <div className="login-mark">HM</div>
          <div>
            <div className="brand-serif login-title">Hotel Manager</div>
            <div className="login-sub">Property Management System</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#F8F9FA', padding: 20, borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B5502F', fontWeight: 600, marginBottom: 8 }}>
            <Sparkles size={16} /> Demo Mode
          </div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
            You are viewing the demonstration version of Hotel Manager. No external backend configuration is required.
          </p>
        </div>

        <button className="btn btn-primary btn-full" onClick={onLogin} style={{ padding: '14px 24px', fontSize: 16 }}>
          Enter Demo Workspace <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </button>
      </div>
    </div>
  );
}
