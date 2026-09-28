import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, AuthLayout, Field, Success } from '../components/AuthLayout.jsx';
import { CheckCircle2, RotateCw } from 'lucide-react';

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
      subtitle="Enter the 6-digit verification code sent to your inbox"
      footer={
        <Link
          to="/login"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <Success>{info}</Success>

        <Field label="Email Address">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <Field label="6-Digit Verification Code">
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-center tracking-widest text-lg font-mono font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{busy ? 'Verifying…' : 'Verify Email'}</span>
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={!email}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Resend verification code</span>
        </button>
      </form>
    </AuthLayout>
  );
}
