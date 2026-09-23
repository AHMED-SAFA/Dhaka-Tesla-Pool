import { Link } from "react-router-dom";
import { Zap, Users, ShieldCheck, MapPin, Star } from "lucide-react";

const STATS = [
  { value: "50K+", label: "Pooled rides" },
  { value: "18%", label: "Avg. fare savings" },
  { value: "90 sec", label: "Avg. match time" },
  { value: "4.8", label: "Rider rating" },
];

const STEPS = [
  {
    title: "Request your ride",
    text: "Set your pickup and destination anywhere from Gulshan to Mirpur. We show you an upfront fare before you book.",
  },
  {
    title: "Get matched & pooled",
    text: "If someone nearby is headed your way, we pair you into the same car — each rider still pays their own fare.",
  },
  {
    title: "Ride and split fairly",
    text: "Track your driver in real time, ride together, and pay only for your share of the trip.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified drivers",
    text: "Every driver is background-checked and rated by riders after each trip.",
  },
  {
    icon: MapPin,
    title: "Live tracking",
    text: "See your driver's location and ETA from the moment you're matched.",
  },
  {
    icon: Users,
    title: "Fair per-seat pricing",
    text: "Pooling never costs you more — you always see your own fare, not a shared guess.",
  },
];

const TESTIMONIALS = [
  {
    initials: "TR",
    name: "Tanvir R.",
    role: "Daily commuter, Banani",
    quote:
      "Cut my commute cost almost in half without adding much time to the ride.",
  },
  {
    initials: "MH",
    name: "Mahia H.",
    role: "Rider, Dhanmondi",
    quote:
      "Matching is quick and I always know who's in the car with me before it arrives.",
  },
  {
    initials: "SK",
    name: "Shakil K.",
    role: "Driver partner",
    quote:
      "I fill empty seats I'd have driven anyway — it's extra income on the same route.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="font-semibold tracking-tight">
              Dhaka Tesla Pool
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/login"
              className="text-neutral-600 hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Share the ride. Split the fare.
            </h1>
            <p className="mt-5 max-w-md text-lg text-neutral-600">
              Dhaka Tesla Pool matches you with riders headed your way, so you
              get a shared ride at a fraction of the cost — without the wait of
              public transit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Request a ride
              </Link>
              <Link
                to="/register"
                className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Drive with us
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1761579340221-e50ba39c3e57?fm=jpg&q=80&w=1200&auto=format&fit=crop"
              alt="City street at night with car lights"
              className="h-80 w-full rounded-2xl object-cover sm:h-96"
            />
            <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg shadow-black/10">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <div>
                <p className="text-sm font-semibold">4.8 rider rating</p>
                <p className="text-xs text-neutral-500">from 12,000+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-semibold text-emerald-700">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-neutral-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How pooling works
        </h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features + photo */}
      <section className="bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <img
            src="https://images.unsplash.com/photo-1624543349832-2e70c917cc12?fm=jpg&q=80&w=1200&auto=format&fit=crop"
            alt="Commuters on a city street"
            className="h-80 w-full rounded-2xl object-cover order-2 lg:order-1"
          />
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for the daily commute
            </h2>
            <div className="mt-8 space-y-6">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What riders say
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-neutral-100 p-6"
            >
              <p className="text-sm text-neutral-700">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-emerald-700">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center text-white">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready for a cheaper commute?
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Dhaka Tesla Pool. All rights reserved.
      </footer>
    </div>
  );
}
