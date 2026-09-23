import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function HomePage() {
  const { user, signOut, ready } = useAuth();

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="/">
          Dhaka Tesla Pool
        </a>
        <nav>
          {user ? (
            <button type="button" className="ghost" onClick={signOut}>
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="btn-link" to="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="hero-copy">
        <p className="eyebrow">Banani rush hour, minus the chaos</p>
        <h1>Share a seat. Split the fare. Survive Dhaka traffic.</h1>
        {user ? (
          <div className="card">
            <p className="muted">Signed in as</p>
            <h2>
              {user.fullName} · {user.role}
            </h2>
            <p>{user.email}</p>
            <p className="muted">Ride request and driver flows come next. Auth is live.</p>
          </div>
        ) : (
          <p className="muted">Create a passenger or driver account to continue. Email verification is required.</p>
        )}
      </main>
    </div>
  );
}
