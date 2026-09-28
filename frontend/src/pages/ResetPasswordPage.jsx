import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, AuthLayout, Field, Success } from '../components/AuthLayout.jsx';
import { KeyRound } from 'lucide-react';

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
      subtitle="Choose a new secure password for your account"
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
        {!token ? <Alert>Missing reset token. Use the link from your email.</Alert> : null}

        <Field label="New Password (min 8 characters)">
          <input
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <button
          type="submit"
          disabled={busy || !token}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 py-3 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
        >
          <KeyRound className="h-4 w-4" />
          <span>{busy ? 'Saving…' : 'Update Password'}</span>
        </button>
      </form>
    </AuthLayout>
  );
}
