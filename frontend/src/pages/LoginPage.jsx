import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, AuthLayout, Field } from '../components/AuthLayout.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: form });
      signIn(data);
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Verified email required — we will send a new code if you skipped that step."
      footer={
        <p className="footer-link">
          <Link to="/forgot-password">Forgot password?</Link>
          <br />
          New here? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <p className="eyebrow" style={{ fontSize: '11px', textAlign: 'center' }}>Demo Cast (1-Click Login)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '11px', padding: '6px', margin: 0 }}
              onClick={() => {
                setForm({ email: 'jashim@tesla.dhaka', password: 'Password123' });
              }}
            >
              🚗 Jashim (Driver)
            </button>
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '11px', padding: '6px', margin: 0 }}
              onClick={() => {
                setForm({ email: 'nusrat@tesla.dhaka', password: 'Password123' });
              }}
            >
              🚶 Nusrat (Passenger)
            </button>
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '11px', padding: '6px', margin: 0 }}
              onClick={() => {
                setForm({ email: 'rafiq@tesla.dhaka', password: 'Password123' });
              }}
            >
              🚶 Rafiq (Passenger)
            </button>
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '11px', padding: '6px', margin: 0 }}
              onClick={() => {
                setForm({ email: 'shirin@tesla.dhaka', password: 'Password123' });
              }}
            >
              🚶 Shirin (Passenger)
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
