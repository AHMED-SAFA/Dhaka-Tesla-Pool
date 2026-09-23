import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "../auth.jsx";
import PassengerDashboard from "../components/PassengerDashboard.jsx";
import DriverDashboard from "../components/DriverDashboard.jsx";
import Sidebar, { MobileTabs } from "../components/Sidebar.jsx";
import ProfilePage from "../components/ProfilePage.jsx";
import LandingPage from "../../src/pages/LandingPage.jsx";

export default function HomePage() {
  const { user, signOut, updateUser, ready } = useAuth();
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

  if (!user) return <LandingPage />;

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
          {activeSection === "profile" ? (
            <ProfilePage user={user} updateUser={updateUser} />
          ) : (
            activeSection &&
            (user.role === "driver" ? (
              <DriverDashboard user={user} section={activeSection} />
            ) : (
              <PassengerDashboard user={user} section={activeSection} />
            ))
          )}
        </main>
      </div>
    </div>
  );
}
