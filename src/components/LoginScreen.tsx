import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";

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
    <div className="relative min-h-screen overflow-hidden bg-[#050817] px-4 py-6 text-white sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(113,228,155,0.18),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(118,80,223,0.2),transparent_32%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="hidden lg:block">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/icon.png" alt="" className="h-11 w-11 rounded-[8px]" />
              <div>
                <p className="text-lg font-black">UmmahWay</p>
                <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                  Admin console
                </p>
              </div>
            </Link>

            <div className="mt-12 max-w-xl">
              <p className="text-sm font-black uppercase tracking-wide text-[#71e49b]">
                Secure masjid management
              </p>
              <h1 className="mt-4 text-6xl font-black leading-[0.95] tracking-normal">
                Keep every community update official.
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/65">
                Manage active masjid pages, daily prayer times, Jumu'ah slots,
                announcements, Ramadan settings, and sponsorship workflows from
                one focused workspace.
              </p>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["Live", "public pages"],
                ["Active", "masjid directory"],
                ["Secure", "admin access"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-2xl font-black text-[#71e49b]">{value}</p>
                  <p className="mt-1 text-sm font-bold text-white/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/icon.png"
                  alt=""
                  className="h-11 w-11 rounded-[8px]"
                />
                <div>
                  <p className="text-lg font-black">UmmahWay</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Admin console
                  </p>
                </div>
              </Link>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#0b1224]/88 p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-7">
              <div className="rounded-[24px] bg-[#071020] p-5 ring-1 ring-white/5">
                <p className="text-xs font-black uppercase tracking-wide text-[#71e49b]">
                  UmmahWay
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-normal">
                  Admin sign in
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Only authorized masjid and platform administrators can access
                  this workspace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wide text-white/50">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-[16px] border border-white/10 bg-[#050817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#71e49b] focus:ring-4 focus:ring-[#71e49b]/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={busy || loading}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wide text-white/50">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-[16px] border border-white/10 bg-[#050817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#71e49b] focus:ring-4 focus:ring-[#71e49b]/10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={busy || loading}
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <p className="rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || loading}
                  className="flex w-full items-center justify-center rounded-[18px] bg-[#71e49b] px-5 py-3.5 text-sm font-black text-[#04100d] shadow-lg shadow-[#71e49b]/15 transition hover:bg-[#8cf3ae] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy || loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between gap-4 text-xs font-bold text-white/45">
                <Link to="/" className="hover:text-[#71e49b]">
                  Public site
                </Link>
                <Link to="/reset-password" className="hover:text-[#71e49b]">
                  Reset password
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs font-bold leading-5 text-white/35">
              Access is limited to profiles with the required admin role.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
