import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Jashim (Driver · Bullet 3 seats)', email: 'jashim@tesla.dhaka', role: 'driver' },
  { label: 'Nusrat (Passenger 1)', email: 'nusrat@tesla.dhaka', role: 'passenger' },
  { label: 'Rafiq (Passenger 2)', email: 'rafiq@tesla.dhaka', role: 'passenger' },
  { label: 'Shirin (Passenger 3)', email: 'shirin@tesla.dhaka', role: 'passenger' },
];

export default function QuickDemoBar() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleQuickLogin(email) {
    setLoading(true);
    setErr('');
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'Password123' },
      });
      signIn(res);
    } catch (e) {
      setErr(e.message || 'Demo login failed. Make sure DB is seeded.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="demo-bar">
      <div className="demo-bar-inner">
        <span className="demo-title">⚡ PRD Demo Cast:</span>
        <div className="demo-buttons">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="demo-btn"
              disabled={loading}
              onClick={() => handleQuickLogin(acc.email)}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
      {err && <div className="demo-err">{err}</div>}
    </div>
  );
}
