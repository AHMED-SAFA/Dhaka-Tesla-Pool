import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, AuthLayout, Field } from '../components/AuthLayout.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'passenger',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: {
          ...form,
          phone: form.phone || undefined,
        },
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Passengers request rides. Drivers take Bullet (and friends) online."
      footer={
        <p className="footer-link">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Field label="Full name">
          <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        </Field>
        <Field label="Phone (optional)">
          <input placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </Field>
        <fieldset className="roles">
          <legend>I am a</legend>
          <label>
            <input
              type="radio"
              name="role"
              checked={form.role === 'passenger'}
              onChange={() => update('role', 'passenger')}
            />
            Passenger
          </label>
          <label>
            <input
              type="radio"
              name="role"
              checked={form.role === 'driver'}
              onChange={() => update('role', 'driver')}
            />
            Driver
          </label>
        </fieldset>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
