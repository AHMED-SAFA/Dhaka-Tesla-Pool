import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import PassengerDashboard from '../components/PassengerDashboard.jsx';
import DriverDashboard from '../components/DriverDashboard.jsx';
import QuickDemoBar from '../components/QuickDemoBar.jsx';

export default function HomePage() {
  const { user, signOut, ready } = useAuth();

  if (!ready) {
    return (
      <div className="page">
        <p className="muted" style={{ padding: '40px', textAlign: 'center' }}>Loading Dhaka Tesla Pool…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-group">
          <a className="brand" href="/">
            ⚡ Dhaka Tesla Pool
          </a>
          <span className="brand-badge">Banani Rush-Hour</span>
        </div>
        <nav>
          {user ? (
            <div className="user-nav">
              <span className="user-greeting">
                <strong>{user.fullName}</strong> ({user.role})
              </span>
              <button type="button" className="ghost" onClick={signOut}>
                Sign out
              </button>
            </div>
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

      {/* Demo Cast Quick-Login Switcher */}
      <QuickDemoBar />

      <main className="main-content">
        {!user ? (
          <div className="hero-landing">
            <span className="eyebrow">Share a seat. Split the fare. Survive Dhaka traffic.</span>
            <h1>Dhaka Tesla Pool</h1>
            <p className="hero-sub">
              Nusrat wants to get from <strong>Banani to Mohakhali</strong>. Rafiq wants to get from <strong>Banani to Gulshan 1</strong>. Jashim's <strong>Bullet</strong> has three seats.
              Share the Tesla, split the fare fairly, and ride in comfort.
            </p>
            <div className="guest-cta-row">
              <Link to="/login" className="cta-btn">Sign in to Test</Link>
              <Link to="/register" className="cta-btn-secondary">Register New User</Link>
            </div>
          </div>
        ) : user.role === 'driver' ? (
          <div className="driver-section">
            <DriverDashboard user={user} />
          </div>
        ) : (
          <div className="passenger-section">
            <PassengerDashboard user={user} />
          </div>
        )}
      </main>
    </div>
  );
}
