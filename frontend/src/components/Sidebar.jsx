import {
  Zap,
  LogOut,
  LayoutDashboard,
  Radar,
  History,
  Car,
  UserRound,
} from "lucide-react";

export const NAV_ITEMS = {
  driver: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "history", label: "Trip History", icon: History },
    { id: "profile", label: "Profile", icon: UserRound },
  ],
  passenger: [
    { id: "ride", label: "Book a Ride", icon: Car },
    { id: "history", label: "Trip History", icon: History },
    { id: "profile", label: "Profile", icon: UserRound },
  ],
};

export default function Sidebar({ user, signOut, activeSection, onSelect }) {
  const items = NAV_ITEMS[user.role] || [];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-white/5 md:bg-neutral-900/40">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-6 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="font-semibold tracking-tight">Dhaka Tesla Pool</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-4 py-4">
        <div className="mb-3 text-sm">
          <p className="font-medium text-neutral-100">{user.fullName}</p>
          <p className="capitalize text-neutral-500">{user.role}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileTabs({ role, activeSection, onSelect }) {
  const items = NAV_ITEMS[role] || [];
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-white/5 px-4 py-2 md:hidden">
      {items.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-emerald-400/10 text-emerald-400"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
