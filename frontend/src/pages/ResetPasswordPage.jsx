import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, AuthLayout, Field, Success } from '../components/AuthLayout.jsx';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const token = params.get('token') || '';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      });
      setInfo(data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password. Links expire after one hour."
      footer={
        <p className="footer-link">
          <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Success>{info}</Success>
        {!token ? <Alert>Missing reset token. Use the link from your email.</Alert> : null}
        <Field label="New password">
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button type="submit" disabled={busy || !token}>
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
