export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="/">
          Dhaka Tesla Pool
        </a>
      </header>
      <main className="card-wrap">
        <section className="card">
          <p className="eyebrow">Share a seat. Split the fare.</p>
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
          {children}
          {footer}
        </section>
      </main>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return <div className="alert">{children}</div>;
}

export function Success({ children }) {
  if (!children) return null;
  return <div className="success">{children}</div>;
}
