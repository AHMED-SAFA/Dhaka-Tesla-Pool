import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, AuthLayout, Field, Success } from '../components/AuthLayout.jsx';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = params.get('token');
    if (!token) return;
    setBusy(true);
    api(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        signIn(data);
        navigate('/');
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [params, navigate, signIn]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/verify-email', {
        method: 'POST',
        body: { email, code },
      });
      signIn(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError('');
    setInfo('');
    try {
      const data = await api('/api/auth/resend-verification', {
        method: 'POST',
        body: { email },
      });
      setInfo(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent, or use the link in the same email."
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
        <Field label="6-digit code">
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <button type="submit" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify email'}
        </button>
        <button type="button" className="ghost" onClick={resend} disabled={!email}>
          Resend code
        </button>
      </form>
    </AuthLayout>
  );
}
