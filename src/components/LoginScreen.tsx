import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";

// Rub el Hizb star lattice — a quiet backdrop on the deep-green panel.
const StarLattice: React.FC<{ className?: string; id: string }> = ({
  className = "",
  id,
}) => (
  <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id={id} width="88" height="88" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="27" y="27" width="34" height="34" />
          <rect
            x="27"
            y="27"
            width="34"
            height="34"
            transform="rotate(45 44 44)"
          />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

const brandFeatures = [
  "Daily prayer and jama'ah times",
  "Jumu'ah slots and khutbah notes",
  "News and notices for the community",
];

const LoginScreen: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a3d30] px-4 py-6 text-white sm:px-6">
      <StarLattice
        id="login-lattice"
        className="absolute inset-0 h-full w-full text-[#e6cf9a] opacity-[0.06]"
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(230,207,154,.5), transparent)",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="hidden lg:block">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/icon.png" alt="" className="h-11 w-11 rounded-lg" />
              <div>
                <p className="font-display text-xl font-semibold">UmmahWay</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#e6cf9a]">
                  Admin console
                </p>
              </div>
            </Link>

            <div className="mt-12 max-w-xl">
              <p className="font-arabic text-2xl text-[#e6cf9a]">
                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
              </p>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] xl:text-6xl">
                Keep your masjid's page up to date.
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/70">
                Sign in to manage prayer times, Jumu'ah, announcements and
                Ramadan settings for your masjid — all from one place.
              </p>
            </div>

            <div className="mt-10 grid max-w-xl gap-3">
              {brandFeatures.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#e6cf9a] text-[#0a3d30]">
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </span>
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-3">
                <img src="/icon.png" alt="" className="h-11 w-11 rounded-lg" />
                <div>
                  <p className="font-display text-xl font-semibold">UmmahWay</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#e6cf9a]">
                    Admin console
                  </p>
                </div>
              </Link>
            </div>

            <div className="rounded-3xl border border-[#e7e1d3] bg-[#faf8f1] p-5 text-[#1c2b26] shadow-2xl shadow-black/25 sm:p-7">
              <div className="rounded-2xl border border-[#e7e1d3] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a8c68]">
                  UmmahWay
                </p>
                <h1 className="mt-2 font-display text-3xl font-semibold">
                  Admin sign in
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#6b7a74]">
                  For masjid and platform administrators.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#9a8c68]">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-[#e7e1d3] bg-white px-4 py-3 text-sm text-[#1c2b26] outline-none transition placeholder:text-[#b0a483] focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={busy || loading}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#9a8c68]">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-[#e7e1d3] bg-white px-4 py-3 text-sm text-[#1c2b26] outline-none transition placeholder:text-[#b0a483] focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={busy || loading}
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium leading-5 text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || loading}
                  className="flex w-full items-center justify-center rounded-xl bg-[#0f5c46] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/20 transition hover:bg-[#0a3d30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy || loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between gap-4 text-xs font-medium text-[#6b7a74]">
                <Link to="/" className="hover:text-[#0f5c46]">
                  Public site
                </Link>
                <Link to="/reset-password" className="hover:text-[#0f5c46]">
                  Reset password
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-white/45">
              Access is limited to accounts with an admin role.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
