// src/components/LoginScreen.tsx
import React, { useState } from "react";
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase">
            Ummah Way
          </div>
          <h1 className="mt-2 text-lg font-semibold text-slate-50">
            Admin Console Login
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Only authorized administrators can access this panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-slate-200 text-xs">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={busy || loading}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-200 text-xs">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy || loading}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || loading}
            className="w-full rounded-lg bg-emerald-500 text-emerald-950 font-semibold py-2 text-sm disabled:opacity-60"
          >
            {busy || loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
