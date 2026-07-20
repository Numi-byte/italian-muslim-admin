import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";

type View = "checking" | "request" | "set" | "success" | "error";
type MessageTone = "info" | "error" | "success";

const MIN_PASSWORD_LEN = 6;

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

const inputClass =
  "w-full rounded-xl border border-[#e7e1d3] bg-white px-4 py-3 text-sm text-[#1c2b26] outline-none transition placeholder:text-[#b0a483] focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12 disabled:cursor-not-allowed disabled:bg-[#f4f1e8]";

const primaryButtonClass =
  "flex w-full items-center justify-center rounded-xl bg-[#0f5c46] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/20 transition hover:bg-[#0a3d30] disabled:cursor-not-allowed disabled:opacity-60";

const resetSteps = [
  "Open the secure link from your inbox.",
  "Choose a new password for this admin account.",
  "Sign in again after the password is saved.",
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [view, setView] = useState<View>("checking");
  const [message, setMessage] = useState("Preparing...");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [busy, setBusy] = useState(false);

  // Request form
  const [email, setEmail] = useState("");

  // Set-password form
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // Avoid StrictMode double-init in dev
  const didInitRef = useRef(false);

  useEffect(() => {
    setPageSeo({
      title: "Reset Password | UmmahWay",
      description: "Reset the password for your UmmahWay account.",
      canonicalUrl: getGlobalCanonicalUrl("/reset-password"),
      robots: "noindex,nofollow",
    });
  }, []);

  const urlInfo = useMemo(() => {
    const href = window.location.href;
    const u = new URL(href);
    const hashParams = new URLSearchParams(
      u.hash.startsWith("#") ? u.hash.slice(1) : u.hash
    );
    const getAuthParam = (key: string) =>
      u.searchParams.get(key) ?? hashParams.get(key);

    return {
      href,
      code: getAuthParam("code"),
      error: getAuthParam("error") ?? getAuthParam("error_code"),
      errorDesc: getAuthParam("error_description"),
      type: getAuthParam("type"), // usually "recovery" for password reset links
      hasHashToken:
        hashParams.has("access_token") || hashParams.has("refresh_token"),
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
          setMessageTone("error");
          setMessage(decodeURIComponent(urlInfo.errorDesc || urlInfo.error || "Invalid link."));
          return;
        }

        // If we arrived from a Supabase reset link, we might have:
        // - ?code=... (PKCE flow) OR
        // - #access_token=... (implicit/hash)
        if (urlInfo.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(urlInfo.code);
          if (error) {
            setView("error");
            setMessageTone("error");
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
          setMessageTone("error");
          setMessage(error.message || "Could not read reset session.");
          return;
        }

        if (
          data.session &&
          (urlInfo.code || urlInfo.hasHashToken || urlInfo.type === "recovery")
        ) {
          if (urlInfo.hasHashToken) {
            window.history.replaceState({}, document.title, "/reset-password");
          }
          setView("set");
          setMessageTone("info");
          setMessage("Set a new password for your account.");
          return;
        }

        // No session => user opened the page normally (or link expired)
        setView("request");
        setMessageTone("info");
        setMessage("Enter your email to receive a password reset link.");
      } catch (e: unknown) {
        setView("error");
        setMessageTone("error");
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
      setView("request");
      setMessageTone("error");
      setMessage("Please enter your email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setView("request");
      setMessageTone("error");
      setMessage("Invalid email.");
      return;
    }

    setBusy(true);
    setView("request");
    setMessageTone("info");
    setMessage("Sending reset email...");

    try {
      // IMPORTANT: redirectTo must be whitelisted in Supabase Auth settings
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: canonicalResetUrl,
      });

      if (error) {
        setView("request");
        setMessageTone("error");
        setMessage(error.message || "Could not send reset email.");
        return;
      }

      // Security best practice: do not confirm whether an email exists.
      setView("request");
      setMessageTone("success");
      setMessage("If this email exists, you will receive a reset link shortly. Check your inbox.");
    } catch (e: unknown) {
      setView("request");
      setMessageTone("error");
      setMessage(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (password.length < MIN_PASSWORD_LEN) {
      setView("set");
      setMessageTone("error");
      setMessage(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== password2) {
      setView("set");
      setMessageTone("error");
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setView("set");
    setMessageTone("info");
    setMessage("Updating password...");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setView("set");
        setMessageTone("error");
        setMessage(error.message || "Could not update password.");
        return;
      }

      setView("success");
      setMessageTone("success");
      setMessage("Password updated. Redirecting to login...");

      // Optional: sign out to force a clean login
      await supabase.auth.signOut();

      setTimeout(() => navigate("/login"), 900);
    } catch (e: unknown) {
      setView("set");
      setMessageTone("error");
      setMessage(e instanceof Error ? e.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  const messageClass =
    messageTone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : messageTone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-[#e7e1d3] bg-[#f4f1e8] text-[#6b7a74]";
  const showRequestForm = view === "request" || view === "error";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a3d30] px-4 py-6 text-white sm:px-6">
      <StarLattice
        id="reset-lattice"
        className="absolute inset-0 h-full w-full text-[#e6cf9a] opacity-[0.06]"
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(230,207,154,.5), transparent)",
        }}
      />

      <main className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-10 py-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-11 w-11 rounded-lg" />
            <div>
              <p className="font-display text-xl font-semibold">UmmahWay</p>
              <p className="text-[10px] font-medium uppercase text-[#e6cf9a]">
                Admin console
              </p>
            </div>
          </Link>

          <div className="mt-12 max-w-xl">
            <p className="font-arabic text-2xl text-[#e6cf9a]">
              Bismillah
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] xl:text-6xl">
              Return securely to your masjid dashboard.
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Reset access for the UmmahWay admin console and continue managing
              official masjid information with a fresh password.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl gap-3">
            {resetSteps.map((item) => (
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
                <p className="text-[10px] font-medium uppercase text-[#e6cf9a]">
                  Admin console
                </p>
              </div>
            </Link>
          </div>

          <div className="rounded-3xl border border-[#e7e1d3] bg-[#faf8f1] p-5 text-[#1c2b26] shadow-2xl shadow-black/25 sm:p-7">
            <div className="border-b border-[#e7e1d3] pb-5">
              <p className="text-[11px] font-semibold uppercase text-[#9a8c68]">
                Account recovery
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold">
                Reset password
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b7a74]">
                Use the inbox link to set a new password for your UmmahWay
                admin account.
              </p>
            </div>

            <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium leading-6 ${messageClass}`}>
              {message}
              {view === "error" ? (
                <p className="mt-1 text-xs font-normal">
                  You can request a new reset link below.
                </p>
              ) : null}
            </div>

            {view === "checking" && (
              <div className="mt-5 flex items-center gap-3 text-sm text-[#6b7a74]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f5c46] border-t-transparent" />
                Loading reset session...
              </div>
            )}

            {showRequestForm && (
              <form onSubmit={sendResetEmail} className="mt-5 space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9a8c68]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    disabled={busy}
                  />
                </div>

                <button type="submit" disabled={busy} className={primaryButtonClass}>
                  {busy ? "Sending..." : "Send reset link"}
                </button>
              </form>
            )}

            {view === "set" && (
              <form onSubmit={updatePassword} className="mt-5 space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9a8c68]">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="********"
                    autoComplete="new-password"
                    disabled={busy}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9a8c68]">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className={inputClass}
                    placeholder="********"
                    autoComplete="new-password"
                    disabled={busy}
                  />
                </div>

                <button type="submit" disabled={busy} className={primaryButtonClass}>
                  {busy ? "Saving..." : "Save new password"}
                </button>
              </form>
            )}

            {view === "success" && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                Password updated successfully.
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-4 text-xs font-medium text-[#6b7a74]">
              <Link to="/" className="hover:text-[#0f5c46]">
                Public site
              </Link>
              <Link to="/login" className="hover:text-[#0f5c46]">
                Back to login
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-white/45">
            Recovery links are valid only for the account that requested them.
          </p>
        </section>
      </main>
    </div>
  );
}
