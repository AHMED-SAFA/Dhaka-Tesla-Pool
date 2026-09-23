// import "@fontsource-variable/fraunces";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const serif = { fontFamily: "'Fraunces Variable', serif" };

const TIMELINE = [
  { time: "8:41 AM", text: "Jashim brings Bullet online at Banani Road 11." },
  { time: "8:43 AM", text: "Nusrat requests Banani → Mohakhali." },
  {
    time: "8:45 AM",
    text: "Rafiq requests Banani → Gulshan 1 — close enough to pool.",
  },
  {
    time: "8:51 AM",
    text: "Shirin tries to grab the last seat. Only one is left.",
  },
];

const ROLES = [
  {
    name: "Passenger",
    detail:
      "Nusrat, Rafiq, Shirin request seats and track their own fare and status.",
  },
  {
    name: "Pool",
    detail:
      "One Tesla, several trips. Seats never exceed Bullet's fixed capacity.",
  },
  {
    name: "Driver",
    detail: "Jashim sees who's aboard, marks arrival, start, and completion.",
  },
];

export default function LandingPage() {
  return (
    <div
      style={{ background: "#14110D", color: "#F3ECDF" }}
      className="min-h-screen selection:bg-[#E8A33D]/20"
    >
      <style>{`
        .perforated {
          background-image: radial-gradient(circle, #14110D 3px, transparent 3px);
          background-size: 14px 100%;
          background-position: left center;
          background-repeat: repeat-x;
        }
        .seat-live { animation: seat-pulse 2.2s ease-in-out infinite; }
        @keyframes seat-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (prefers-reduced-motion: reduce) { .seat-live { animation: none; } }
      `}</style>

      {/* Nav */}
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-2 text-[#F3ECDF]">
            <Zap className="h-4 w-4 text-[#E8A33D]" strokeWidth={2.5} />
            <span style={serif} className="text-lg font-medium">
              Dhaka Tesla Pool
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/login"
              className="text-[#A79C89] transition-colors hover:text-[#F3ECDF]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-[#E8A33D] px-4 py-2 font-medium text-[#14110D] transition-colors hover:bg-[#F2B85A]"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div>
          <h1
            style={serif}
            className="max-w-lg text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl"
          >
            One Tesla. Two trips. A fair split.
          </h1>
          <p className="mt-6 max-w-md text-[#A79C89] sm:text-lg">
            Jashim's three-seat Bullet is idling on Banani Road. Nusrat needs
            Mohakhali, Rafiq needs Gulshan 1 — close enough to share, cheap
            enough to matter.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="rounded-md bg-[#E8A33D] px-6 py-3 text-sm font-medium text-[#14110D] transition-colors hover:bg-[#F2B85A]"
            >
              Request a ride
            </Link>
            <Link
              to="/register"
              className="text-sm text-[#F3ECDF] underline decoration-[#A79C89]/40 underline-offset-4 transition-colors hover:decoration-[#F3ECDF]"
            >
              Drive with us instead
            </Link>
          </div>
        </div>

        {/* Ticket stub */}
        <div className="rounded-2xl bg-[#1E1912] p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-[#A79C89]">
            <span>BULLET</span>
            <span>3-SEAT TESLA</span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A79C89]">Nusrat</p>
                <p style={serif} className="text-lg">
                  Banani → Mohakhali
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#E8A33D]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A79C89]">Rafiq</p>
                <p style={serif} className="text-lg">
                  Banani → Gulshan 1
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#E8A33D]" />
            </div>
            <div className="flex items-center justify-between opacity-70">
              <p className="text-sm text-[#A79C89]">1 seat open</p>
              <span className="seat-live h-2.5 w-2.5 rounded-full border border-[#3FA793]" />
            </div>
          </div>

          <div className="perforated my-5 h-px" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#A79C89]">Nusrat's fare</span>
            <span className="font-medium">৳52</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-[#A79C89]">Rafiq's fare</span>
            <span className="font-medium">৳56</span>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-y border-white/[0.06] bg-[#1E1912]/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 style={serif} className="text-2xl font-medium">
            How the rush hour plays out
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-4">
            {TIMELINE.map(({ time, text }, i) => (
              <div key={time} className="relative pl-5">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[#E8A33D]" />
                {i < TIMELINE.length - 1 && (
                  <span className="absolute left-[3.5px] top-4 hidden h-[calc(100%+2rem)] w-px bg-white/[0.08] sm:block" />
                )}
                <p className="text-sm text-[#E8A33D]">{time}</p>
                <p className="mt-1.5 text-sm text-[#A79C89]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 style={serif} className="text-2xl font-medium">
          One trip, three roles
        </h2>
        <div className="relative mt-12 grid gap-10 sm:grid-cols-3">
          <div className="absolute top-2 left-0 right-0 hidden h-px bg-white/[0.08] sm:block" />
          {ROLES.map((role) => (
            <div key={role.name} className="relative pt-8">
              <span className="absolute top-0 left-0 h-2.5 w-2.5 rounded-full bg-[#E8A33D]" />
              <h3 style={serif} className="text-lg">
                {role.name}
              </h3>
              <p className="mt-2 text-sm text-[#A79C89]">{role.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Receipt */}
      <section className="border-t border-white/[0.06] bg-[#1E1912]/40">
        <div className="mx-auto max-w-md px-6 py-20">
          <h2 style={serif} className="text-2xl font-medium">
            Nusrat's fare, itemized
          </h2>
          <div className="mt-8 rounded-2xl bg-[#1E1912] p-6 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-[#A79C89]">Base fare</span>
              <span>৳20</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-[#A79C89]">Distance charge</span>
              <span>৳45</span>
            </div>
            <div className="mt-2 flex justify-between text-[#3FA793]">
              <span>Pool discount</span>
              <span>−৳13</span>
            </div>
            <div className="perforated my-4 h-px" />
            <div className="flex justify-between text-base">
              <span>Total</span>
              <span>৳52</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 style={serif} className="text-3xl font-medium">
            Ready when Jashim is.
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-md bg-[#E8A33D] px-6 py-3 text-sm font-medium text-[#14110D] transition-colors hover:bg-[#F2B85A]"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="text-sm text-[#F3ECDF] underline decoration-[#A79C89]/40 underline-offset-4 transition-colors hover:decoration-[#F3ECDF]"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-16 text-xs text-[#A79C89]">
            Built with React, Node.js, PostgreSQL, Socket.IO, and Docker.
          </p>
        </div>
      </section>
    </div>
  );
}
