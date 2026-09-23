import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, AuthLayout, Field, Success } from '../components/AuthLayout.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const data = await api('/api/auth/forgot-password', { method: 'POST', body: { email } });
      setInfo(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We will email a reset link if this address is registered."
      footer={
        <p className="footer-link">
          <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Success>{info}</Success>
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
