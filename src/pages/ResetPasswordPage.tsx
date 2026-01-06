// src/pages/ResetPasswordPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // adjust path if yours differs

type Status = "loading" | "ready" | "success" | "error";

const MIN_PASSWORD_LEN = 6;

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Preparing reset…");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);

  // Guard against React.StrictMode double-invoking effects in dev
  const didInitRef = useRef(false);

  const urlInfo = useMemo(() => {
    const href = window.location.href;
    const u = new URL(href);
    const code = u.searchParams.get("code");
    const error = u.searchParams.get("error");
    const errorDesc = u.searchParams.get("error_description");
    const type = u.searchParams.get("type"); // sometimes "recovery"
    const hasHashToken =
      href.includes("#access_token=") || href.includes("#refresh_token=");
    return { href, code, error, errorDesc, type, hasHashToken };
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const init = async () => {
      try {
        // If Supabase redirected with an error
        if (urlInfo.error || urlInfo.errorDesc) {
          setStatus("error");
          setMessage(
            decodeURIComponent(urlInfo.errorDesc || urlInfo.error || "Invalid link.")
          );
          return;
        }

        // PKCE/code flow (newer setups)
        if (urlInfo.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(urlInfo.href);
          if (error) {
            setStatus("error");
            setMessage(error.message || "This reset link is invalid or expired.");
            return;
          }
        }

        // Hash token flow (older/implicit) OR after exchangeCodeForSession
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setStatus("error");
          setMessage(error.message || "Could not read reset session.");
          return;
        }

        if (!data.session) {
          // If there's no session, the link is probably expired or your hosting didn't serve the route
          setStatus("error");
          setMessage(
            "No reset session found. The link may be expired, already used, or your site isn’t serving /reset-password correctly."
          );
          return;
        }

        setStatus("ready");
        setMessage("Set a new password for your account.");
      } catch (e: unknown) {
          setStatus("error");
          const errorMessage = e instanceof Error ? e.message : "Something went wrong.";
          setMessage(errorMessage);
        }
    };

    void init();
  }, [urlInfo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (password.length < MIN_PASSWORD_LEN) {
      setStatus("error");
      setMessage(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== password2) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setStatus("ready");
    setMessage("Updating password…");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus("error");
        setMessage(error.message || "Could not update password.");
        return;
      }

      setStatus("success");
      setMessage("Password updated. Redirecting to login…");

      // Optional but recommended: sign out so they explicitly log in again
      await supabase.auth.signOut();

      setTimeout(() => navigate("/login"), 900);
    } catch (e: unknown) {
      setStatus("error");
      const errorMessage = e instanceof Error ? e.message : "Could not update password.";
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.5)]">
            <span className="text-xs font-bold tracking-widest text-emerald-300">
              IM
            </span>
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

          {status === "loading" && (
            <div className="mt-5 text-xs text-slate-400">Loading…</div>
          )}

          {status === "error" && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {message}
              <div className="mt-2 text-[11px] text-slate-300">
                Try requesting a new reset link from the login page.
              </div>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
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

          {status === "success" && (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              Password updated successfully.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
