import React, { useEffect, useState } from 'react';
import { repository } from '../../lib/repository';

export default function CustomersList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repository.getCustomers().then(docs => {
      setCustomers(docs);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading customers...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title brand-serif">Customers</div>
          <div className="page-sub">Guest directory</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={3} className="empty-note">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
