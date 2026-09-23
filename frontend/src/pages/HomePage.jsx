import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "../auth.jsx";
import PassengerDashboard from "../components/PassengerDashboard.jsx";
import DriverDashboard from "../components/DriverDashboard.jsx";
import Sidebar, { MobileTabs } from "../components/Sidebar.jsx";

export default function HomePage() {
  const { user, signOut, ready } = useAuth();
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (user && activeSection === null) {
      setActiveSection(user.role === "driver" ? "overview" : "ride");
    }
  }, [user, activeSection]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex items-center gap-3 text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm tracking-wide">
            Loading Dhaka Tesla Pool…
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-emerald-400/20">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 transition-colors group-hover:bg-emerald-400/20">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="font-semibold tracking-tight">
                Dhaka Tesla Pool
              </span>
              <span className="hidden sm:inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-neutral-400">
                Pool your Tesla
              </span>
            </a>
            <nav className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm text-neutral-300 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300"
              >
                Create account
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(52,211,153,0.15),transparent)]" />
            <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
              <span className="inline-block rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-medium tracking-wide text-emerald-400">
                Share a seat. Split the fare. Survive Dhaka traffic.
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
                Dhaka Tesla Pool
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-balance text-neutral-400 sm:text-lg">
                Nusrat wants to get from{" "}
                <strong className="text-neutral-200">
                  Banani to Mohakhali
                </strong>
                . Rafiq wants to get from{" "}
                <strong className="text-neutral-200">
                  Banani to Gulshan 1
                </strong>
                . Jashim's <strong className="text-neutral-200">Bullet</strong>{" "}
                has three seats. Share the Tesla, split the fare fairly, and
                ride in comfort.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="group flex items-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300"
                >
                  Sign in to Test
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-neutral-200 transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  Register New User
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <Sidebar
        user={user}
        signOut={signOut}
        activeSection={activeSection}
        onSelect={setActiveSection}
      />

      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 md:hidden">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <Zap className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            Dhaka Tesla Pool
          </span>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </header>

        <MobileTabs
          role={user.role}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />

        <main className="mx-auto max-w-6xl px-6 py-8">
          {activeSection &&
            (user.role === "driver" ? (
              <DriverDashboard user={user} section={activeSection} />
            ) : (
              <PassengerDashboard user={user} section={activeSection} />
            ))}
        </main>
      </div>
    </div>
  );
}
