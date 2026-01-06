import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type View = "checking" | "request" | "set" | "success" | "error";

const MIN_PASSWORD_LEN = 6;

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [view, setView] = useState<View>("checking");
  const [message, setMessage] = useState("Preparing…");
  const [busy, setBusy] = useState(false);

  // Request form
  const [email, setEmail] = useState("");

  // Set-password form
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // Avoid StrictMode double-init in dev
  const didInitRef = useRef(false);

  const urlInfo = useMemo(() => {
    const href = window.location.href;
    const u = new URL(href);
    return {
      href,
      code: u.searchParams.get("code"),
      error: u.searchParams.get("error"),
      errorDesc: u.searchParams.get("error_description"),
      type: u.searchParams.get("type"), // sometimes "recovery"
      hasHashToken: href.includes("#access_token=") || href.includes("#refresh_token="),
    };
  }, []);

  const canonicalResetUrl = useMemo(() => {
    // Always use your current origin (works for localhost + production)
    return `${window.location.origin}/reset-password`;
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const init = async () => {
      try {
        // Supabase redirected with an error
        if (urlInfo.error || urlInfo.errorDesc) {
          setView("error");
          setMessage(decodeURIComponent(urlInfo.errorDesc || urlInfo.error || "Invalid link."));
          return;
        }

        // If we arrived from a Supabase reset link, we might have:
        // - ?code=... (PKCE flow) OR
        // - #access_token=... (implicit/hash)
        if (urlInfo.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(urlInfo.href);
          if (error) {
            setView("error");
            setMessage(error.message || "This reset link is invalid or expired.");
            return;
          }
          // Clean URL so refresh doesn't re-run exchange
          window.history.replaceState({}, document.title, "/reset-password");
        }

        // Now see if we have a session (hash flow sets it automatically if detectSessionInUrl=true)
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setView("error");
          setMessage(error.message || "Could not read reset session.");
          return;
        }

        if (data.session) {
          setView("set");
          setMessage("Set a new password for your account.");
          return;
        }

        // No session => user opened the page normally (or link expired)
        setView("request");
        setMessage("Enter your email to receive a password reset link.");
      } catch (e: unknown) {
        setView("error");
        setMessage(e instanceof Error ? e.message : "Something went wrong.");
      }
    };

    void init();
  }, [urlInfo]);

  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setView("error");
      setMessage("Please enter your email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setView("error");
      setMessage("Invalid email.");
      return;
    }

    setBusy(true);
    setView("request");
    setMessage("Sending reset email…");

    try {
      // IMPORTANT: redirectTo must be whitelisted in Supabase Auth settings
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: canonicalResetUrl,
      });

      if (error) {
        setView("error");
        setMessage(error.message || "Could not send reset email.");
        return;
      }

      // Security best practice: don’t confirm whether an email exists
      setView("request");
      setMessage("If this email exists, you will receive a reset link shortly. Check your inbox.");
    } catch (e: unknown) {
      setView("error");
      setMessage(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (password.length < MIN_PASSWORD_LEN) {
      setView("error");
      setMessage(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== password2) {
      setView("error");
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setView("set");
    setMessage("Updating password…");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setView("error");
        setMessage(error.message || "Could not update password.");
        return;
      }

      setView("success");
      setMessage("Password updated. Redirecting to login…");

      // Optional: sign out to force a clean login
      await supabase.auth.signOut();

      setTimeout(() => navigate("/login"), 900);
    } catch (e: unknown) {
      setView("error");
      setMessage(e instanceof Error ? e.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.5)]">
            <span className="text-xs font-bold tracking-widest text-emerald-300">IM</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-[0.22em] uppercase text-emerald-300">
              Ummah Way
            </span>
            <span className="text-[11px] text-slate-400">Reset password</span>
          </div>
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.95)]">
          <h1 className="text-lg font-semibold text-slate-100">Reset password</h1>
          <p className="mt-2 text-xs text-slate-400">{message}</p>

          {view === "checking" && (
            <div className="mt-5 text-xs text-slate-400">Loading…</div>
          )}

          {view === "error" && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {message}
              <div className="mt-2 text-[11px] text-slate-300">
                You can request a new reset link below.
              </div>

              <form onSubmit={sendResetEmail} className="mt-3 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400/60"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={busy}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-xl bg-emerald-500 text-emerald-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div className="pt-3 text-[11px] text-slate-500">
                <Link to="/login" className="text-emerald-300 hover:text-emerald-200">
                  Back to login
                </Link>
              </div>
            </div>
          )}

          {view === "request" && (
            <form onSubmit={sendResetEmail} className="mt-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400/60"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={busy}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-1 h-11 rounded-xl bg-emerald-500 text-emerald-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>

              <div className="pt-2 text-[11px] text-slate-500">
                <Link to="/login" className="text-emerald-300 hover:text-emerald-200">
                  Back to login
                </Link>
              </div>
            </form>
          )}

          {view === "set" && (
            <form onSubmit={updatePassword} className="mt-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400/60"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400/60"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 h-11 rounded-xl bg-emerald-500 text-emerald-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save new password"}
              </button>

              <div className="pt-2 text-[11px] text-slate-500">
                <Link to="/login" className="text-emerald-300 hover:text-emerald-200">
                  Back to login
                </Link>
              </div>
            </form>
          )}

          {view === "success" && (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              Password updated successfully.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
