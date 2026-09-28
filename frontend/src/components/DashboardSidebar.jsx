import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  MapPin,
  Car,
  Clock,
  Wallet,
  Navigation,
  Users,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  Gauge,
  CircleDot,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../auth.jsx";

/**
 * Default navigation items by role
 */
export const PASSENGER_NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "book", label: "Book a Ride", icon: MapPin },
  { id: "active", label: "Active Ride", icon: Car },
  { id: "history", label: "Ride History", icon: Clock },
];

export const DRIVER_NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "dispatch", label: "Live Navigation", icon: Navigation },
  { id: "tesla", label: "Tesla Vehicle", icon: Zap },
  { id: "passengers", label: "Passenger Pool", icon: Users },
  { id: "earnings", label: "Earnings & Trips", icon: History },
];

/**
 * Reusable Dashboard Sidebar Navigation
 *
 * @param {Object} props
 * @param {Object} [props.user] - User object ({ fullName, role, email })
 * @param {string} [props.activeTab] - ID of currently active navigation item
 * @param {Function} [props.onSelectTab] - Callback when an item is clicked (id) => void
 * @param {Array} [props.items] - Optional custom nav items [{ id, label, icon, badge }]
 * @param {Function} [props.onSignOut] - Logout handler
 * @param {React.ReactNode} [props.extraWidget] - Optional status widget inside sidebar
 */
export default function DashboardSidebar({
  user: propUser,
  activeTab,
  onSelectTab,
  items: customItems,
  onSignOut,
  extraWidget,
}) {
  const { user: authUser, signOut: authSignOut } = useAuth();
  const user = propUser || authUser;
  const handleSignOut = onSignOut || authSignOut;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || "passenger";
  const navItems =
    customItems || (role === "driver" ? DRIVER_NAV_ITEMS : PASSENGER_NAV_ITEMS);

  const handleItemClick = (id) => {
    if (onSelectTab) onSelectTab(id);
    setMobileOpen(false);
  };

  const userInitials = (user?.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile Topbar with Hamburger Toggle */}
      <div className="md:hidden flex items-center justify-between border-b border-white/10 bg-neutral-950/90 px-4 py-3 backdrop-blur-md sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
            <Zap className="h-4 w-4" />
          </span>
          <span className="font-semibold text-sm tracking-tight text-white">
            Dhaka Tesla
          </span>
          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 capitalize">
            {role}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 p-1.5 text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar (Desktop fixed/sticky, Mobile drawer) */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen shrink-0 border-r border-white/5 bg-neutral-950/95 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Top: Brand & Role */}
        <div>
          <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
            <Link to="/" className="flex items-center gap-3 overflow-hidden">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/10 border border-emerald-400/20 text-emerald-400 shadow-sm shadow-emerald-400/10">
                <Zap className="h-5 w-5" />
              </span>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold tracking-tight text-sm text-neutral-100 truncate">
                    Dhaka Tesla Pool
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        role === "driver" ? "bg-cyan-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-neutral-400 capitalize">
                      {role} Portal
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Collapse toggle (Desktop only) */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:text-neutral-100 hover:border-white/20 hover:bg-white/5 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Optional Status / Quick Stats Widget */}
          {extraWidget && !isCollapsed && (
            <div className="px-3 pt-3">{extraWidget}</div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {!isCollapsed && (
              <span className="block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Navigation
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                    ${
                      isActive
                        ? "bg-emerald-400/10 text-emerald-400 shadow-sm border border-emerald-400/20"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                    }
                    ${isCollapsed ? "justify-center px-0" : ""}
                  `}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-neutral-400 group-hover:text-neutral-200"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate text-left flex-1">
                      {item.label}
                    </span>
                  )}

                  {/* Active highlight pill */}
                  {isActive && !isCollapsed && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}

                  {/* Badge */}
                  {item.badge && !isCollapsed && (
                    <span className="rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Card & Sign Out */}
        <div className="p-3 border-t border-white/5 bg-neutral-950/60">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-neutral-900/50 ${
              isCollapsed ? "justify-center p-1.5" : ""
            }`}
          >
            {/* User Initials Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold shadow-inner">
              {userInitials}
            </div>

            {/* User Meta */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-200 truncate">
                  {user?.fullName || "User"}
                </p>
                <p className="text-[11px] text-neutral-500 truncate">
                  {user?.email ||
                    (role === "driver" ? "Verified Driver" : "Passenger")}
                </p>
              </div>
            )}
          </div>

          {handleSignOut && (
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className={`mt-2 inline-flex h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-transparent px-3 text-sm font-medium text-neutral-300 hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 ${
                isCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sign out</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * Reusable Full Dashboard Layout Wrapper with Sidebar and Main Content Area
 */
export function DashboardLayout({
  user,
  activeTab,
  onSelectTab,
  items,
  extraWidget,
  children,
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      <DashboardSidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        items={items}
        extraWidget={extraWidget}
      />
      <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
