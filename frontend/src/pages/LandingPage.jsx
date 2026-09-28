import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Users,
  ShieldCheck,
  MapPin,
  Star,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Leaf,
  Clock,
  Car,
} from "lucide-react";
import { useThemeMode } from "../ThemeModeContext.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

const STATS = [
  { value: "50K+", label: "Shared rides completed" },
  { value: "45%", label: "Average fare savings" },
  { value: "90 sec", label: "Instant Tesla matching" },
  { value: "4.9 ★", label: "Verified rider rating" },
];

const STEPS = [
  {
    step: "01",
    title: "Request your Tesla seat",
    text: "Select your pickup & destination across Gulshan, Banani, Dhanmondi, or Mirpur with transparent per-seat pricing upfront.",
  },
  {
    step: "02",
    title: "Intelligent route pooling",
    text: "Our algorithm pairs you with passengers heading along the same corridor without detours, keeping your trip swift.",
  },
  {
    step: "03",
    title: "Split fares & ride green",
    text: "Hop into an air-conditioned electric Tesla, track live navigation, and pay seamlessly via integrated Stripe cards.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Background-Verified Chauffeurs",
    text: "Professional drivers evaluated after every trip with continuous safety telemetry and vehicle maintenance.",
  },
  {
    icon: MapPin,
    title: "Real-Time GPS Telemetry",
    text: "Interactive live map tracking with dynamic ETAs, waypoint pickups, and instant driver arrival notifications.",
  },
  {
    icon: Leaf,
    title: "Zero Tailpipe Emissions",
    text: "100% electric Tesla Model 3 & Model Y fleet reducing urban smog and carbon footprint on every commute.",
  },
  {
    icon: Users,
    title: "Fair Individual Billing",
    text: "Seats are booked independently. You only pay for your own seat share regardless of other passenger stops.",
  },
];

const TESTIMONIALS = [
  {
    initials: "TR",
    name: "Tanvir Rahman",
    role: "Tech Lead, Banani",
    quote:
      "Cut my daily commute expense by 40% while riding in an air-conditioned Tesla instead of noisy CNGs.",
  },
  {
    initials: "MH",
    name: "Mahia Haque",
    role: "Architect, Dhanmondi",
    quote:
      "Safe, ultra-quiet, and reliable. The live tracking shows exact pickup locations and driver credentials.",
  },
  {
    initials: "SK",
    name: "Shakil Karim",
    role: "Fleet Driver Partner",
    quote:
      "Full occupancy on daily highway corridors means consistent earnings and automated passenger dispatch.",
  },
];

export default function LandingPage() {
  const { mode, toggleTheme } = useThemeMode();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === "dark";

  const handleQuickDemo = async (role) => {
    try {
      const email =
        role === "driver" ? "jashim@tesla.dhaka" : "nusrat@tesla.dhaka";
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email, password: "Password123" },
      });
      signIn(data);
      navigate("/");
    } catch (e) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d0b] text-slate-900 dark:text-neutral-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#090d0b]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold">
              <Zap className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white leading-tight">
                Dhaka Tesla Pool
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                100% Electric Urban Commute
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
              aria-label="Toggle dark/light theme"
              className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px] text-amber-400" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-slate-600" />
              )}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>BANGLADESH'S FIRST PREMIER TESLA POOLING PLATFORM</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.1]">
              Share the ride. <br />
              <span className="text-emerald-600 dark:text-emerald-400">
                Split the fare.
              </span>
            </h1>

            <p className="max-w-xl text-lg text-slate-600 dark:text-neutral-300 leading-relaxed">
              Experience comfortable, quiet electric rides across Dhaka. Match
              with commuters along your corridor, enjoy guaranteed seats, and
              pay up to 45% less than solo cabs.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-white px-6 py-3.5 text-base font-semibold transition-all cursor-pointer"
              >
                <span>Book a Ride</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-neutral-900 px-6 py-3.5 text-base font-semibold text-slate-800 dark:text-white hover:border-slate-400 dark:hover:border-white/30 transition-all cursor-pointer"
              >
                <span>Drive with Tesla</span>
              </Link>
            </div>

            
          </div>

          {/* Right Card: Modern Interactive Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-neutral-900/90 p-6 sm:p-8 shadow-xl transition-all">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                    Live Pooling Radar
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Tesla Model 3 Active
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-neutral-900" />
                    <span className="h-8 w-0.5 bg-slate-200 dark:bg-neutral-700" />
                    <span className="h-3.5 w-3.5 rounded-full bg-emerald-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase">
                        Pickup Location
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                        Banani 11 · Road 12 Junction
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase">
                        Destination
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                        Mohakhali Flyover Hub
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/50 p-4 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Fare
                    </span>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      150 BDT
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                      ETA
                    </span>
                    <p className="text-base font-bold text-slate-800 dark:text-neutral-200">
                      3 mins
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Seats Left
                    </span>
                    <p className="text-base font-bold text-slate-800 dark:text-neutral-200">
                      2 of 4
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                    100% Zero-Carbon Ride
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-neutral-300">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    4.9 (12k+ reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {s.value}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Smarter Urban Commutes in 3 Steps
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-6 space-y-3"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 text-sm font-bold text-white dark:text-neutral-950">
                {s.step}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {s.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-neutral-900/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Premium Standards
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Engineered for Safety, Speed, and Comfort
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900/70 p-6 space-y-3"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Commuter Feedback
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Trusted by Daily Riders Across Dhaka
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-6 flex flex-col justify-between"
            >
              <p className="text-sm text-slate-700 dark:text-neutral-300 italic leading-relaxed">
                “{t.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-xs font-bold text-white dark:text-neutral-950">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="border-t border-slate-200 dark:border-white/10 bg-emerald-600 dark:bg-emerald-700 text-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Upgrade Your Dhaka Daily Commute Today
          </h2>
          <p className="text-base text-emerald-100 max-w-xl mx-auto">
            Join thousands of professionals commuting between Gulshan, Banani,
            and Dhanmondi in silent, green luxury.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="rounded-xl bg-white text-emerald-800 px-6 py-3.5 text-sm font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/40 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 px-6 py-6 text-center text-xs text-slate-500 dark:text-neutral-500">
        © {new Date().getFullYear()} Dhaka Tesla Pool. Zero Emission Urban
        Transit System. All rights reserved.
      </footer>
    </div>
  );
}
