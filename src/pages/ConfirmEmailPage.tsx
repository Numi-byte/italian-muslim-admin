import type { EmailOtpType } from "@supabase/supabase-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { STORE_LINKS } from "../lib/publicLinks";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";
import { supabase } from "../lib/supabaseClient";

type ConfirmationState = "checking" | "success" | "error" | "ready";

const APP_DEEP_LINK = "ummahway://onboarding";
const SUPPORT_EMAIL = "support@ummahway.com";

const allowedOtpTypes = new Set([
  "signup",
  "email",
  "magiclink",
  "invite",
  "email_change",
]);

const ConfirmEmailPage: React.FC = () => {
  const didRunRef = useRef(false);
  const [state, setState] = useState<ConfirmationState>("checking");
  const [message, setMessage] = useState("Confirming your email address...");
  const [confirming, setConfirming] = useState(false);

  const authParams = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        code: null,
        error: null,
        errorDescription: null,
        tokenHash: null,
        type: null,
        hasSessionHash: false,
      };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const getParam = (key: string) => searchParams.get(key) ?? hashParams.get(key);

    return {
      code: getParam("code"),
      error: getParam("error") ?? getParam("error_code"),
      errorDescription: getParam("error_description"),
      tokenHash: getParam("token_hash"),
      type: getParam("type"),
      hasSessionHash:
        hashParams.has("access_token") || hashParams.has("refresh_token"),
    };
  }, []);

  useEffect(() => {
    setPageSeo({
      title: "Confirm Email | UmmahWay",
      description: "Confirm your UmmahWay email address.",
      canonicalUrl: getGlobalCanonicalUrl("/confirm-email"),
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const confirmEmail = async () => {
      if (authParams.error || authParams.errorDescription) {
        setState("error");
        setMessage(
          decodeURIComponent(
            authParams.errorDescription ||
              authParams.error ||
              "This confirmation link could not be used."
          )
        );
        return;
      }

      try {
        if (authParams.tokenHash) {
          setState("ready");
          setMessage("Your secure confirmation link is ready. Tap confirm to finish.");
          return;
        }

        if (authParams.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(authParams.code);

          if (error) {
            setState("error");
            setMessage(error.message || "This confirmation link is invalid or expired.");
            return;
          }

          cleanConfirmUrl();
          setState("success");
          setMessage("Your email has been confirmed. You can now return to UmmahWay.");
          return;
        }

        if (authParams.hasSessionHash) {
          const { data, error } = await supabase.auth.getSession();

          if (error || !data.session) {
            setState("error");
            setMessage(error?.message || "Could not read the confirmation session.");
            return;
          }

          cleanConfirmUrl();
          setState("success");
          setMessage("Your email has been confirmed. You can now return to UmmahWay.");
          return;
        }

        setState("ready");
        setMessage("Open this page from the confirmation link in your email.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    };

    void confirmEmail();
  }, [authParams]);

  const handleConfirmClick = async () => {
    if (!authParams.tokenHash || confirming) return;

    setConfirming(true);
    setState("checking");
    setMessage("Confirming your email address...");

    const rawType = authParams.type || "email";
    const type = (allowedOtpTypes.has(rawType) ? rawType : "email") as EmailOtpType;

    const { error } = await supabase.auth.verifyOtp({
      token_hash: authParams.tokenHash,
      type,
    });

    setConfirming(false);

    if (error) {
      setState("error");
      setMessage(error.message || "This confirmation link is invalid or expired.");
      return;
    }

    cleanConfirmUrl();
    setState("success");
    setMessage("Your email has been confirmed. You can now return to UmmahWay.");
  };

  const toneClass =
    state === "success"
      ? "border-[#0f5c46]/25 bg-[#0f5c46]/[0.06] text-[#0a3d30]"
      : state === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-[#d8cfb8] bg-[#faf8f1] text-[#4a5852]";

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c2b26]">
      <header className="border-b border-[#e7e1d3] bg-[#f7f4ec]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg" />
            <div>
              <div className="font-display text-lg font-semibold text-[#0a3d30]">
                UmmahWay
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9a8c68]">
                Email confirmation
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-[#d8cfb8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                Secure account check
              </p>
            </div>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight text-[#0a3d30]">
              Confirm your email
            </h1>
            <p className="mt-4 text-base leading-7 text-[#4a5852]">
              This page verifies the signup link from your inbox and prepares
              your UmmahWay account for sign in.
            </p>
          </div>

          <div className={`rounded-lg border p-4 text-sm leading-6 ${toneClass}`}>
            <div className="flex items-start gap-3">
              {state === "checking" && (
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-[#0f5c46] border-t-transparent animate-spin" />
              )}
              <p>{message}</p>
            </div>
          </div>

          {state === "error" && (
            <p className="text-sm leading-6 text-[#6b7a74]">
              If the link has expired, open UmmahWay and create the account
              again, or contact{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-[#0f5c46] underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          )}
        </section>

        <section className="rounded-lg border border-[#e7e1d3] bg-white p-6 shadow-xl shadow-[#0a3d30]/10">
          <h2 className="font-display text-3xl font-semibold text-[#0a3d30]">
            Continue in UmmahWay
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#4a5852]">
            After confirmation, return to the app and sign in with the same
            email and password you used during onboarding.
          </p>

          <div className="mt-6 grid gap-3">
            {authParams.tokenHash && state !== "success" ? (
              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={confirming || state === "checking"}
                className="inline-flex items-center justify-center rounded-lg bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/15 hover:bg-[#0a3d30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming || state === "checking" ? "Confirming..." : "Confirm email"}
              </button>
            ) : (
              <a
                href={APP_DEEP_LINK}
                className="inline-flex items-center justify-center rounded-lg bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/15 hover:bg-[#0a3d30]"
              >
                Open UmmahWay app
              </a>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={STORE_LINKS.ios}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-[#d8cfb8] bg-[#faf8f1] px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
              >
                App Store
              </a>
              <a
                href={STORE_LINKS.android}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-[#d8cfb8] bg-[#faf8f1] px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
              >
                Google Play
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

function cleanConfirmUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, "/confirm-email");
}

export default ConfirmEmailPage;
