import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";

const SUPPORT_EMAIL = "support@ummahway.com";

const contactTopics = [
  { value: "purchase", label: "Purchase or subscription" },
  { value: "login_access", label: "Login or account access" },
  { value: "masjid_timings", label: "Masjid or Jamaah timings" },
  { value: "technical", label: "Technical issue" },
  { value: "privacy", label: "Privacy or data request" },
  { value: "other", label: "Other" },
] as const;

type ContactTopic = (typeof contactTopics)[number]["value"];

type FormState = {
  name: string;
  email: string;
  topic: ContactTopic;
  subject: string;
  message: string;
  website: string;
};

type ContactSupportPanelProps = {
  embedded?: boolean;
  defaultTopic?: ContactTopic;
};

const emptyForm = (topic: ContactTopic): FormState => ({
  name: "",
  email: "",
  topic,
  subject: "",
  message: "",
  website: "",
});

export const ContactSupportPanel: React.FC<ContactSupportPanelProps> = ({
  embedded = false,
  defaultTopic = "purchase",
}) => {
  // The panel is reused inside the light admin console (embedded) and on the
  // public /contact page. Style it to match its surroundings.
  const inputClass = embedded
    ? "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
    : "w-full rounded-xl border border-[#e7e1d3] bg-[#faf8f1] px-3.5 py-2.5 text-sm text-[#1c2b26] outline-none transition placeholder:text-[#b0a483] focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12";
  const labelClass = embedded
    ? "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
    : "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#9a8c68]";
  const { session, user } = useAuth();
  const location = useLocation();
  const queryTopic = useMemo(() => {
    const value = new URLSearchParams(location.search).get("topic");
    return isContactTopic(value) ? value : defaultTopic;
  }, [defaultTopic, location.search]);
  const [form, setForm] = useState<FormState>(() => emptyForm(queryTopic));
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"success" | "error" | null>(
    null
  );

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => (prev.email ? prev : { ...prev, email: user.email ?? "" }));
  }, [user?.email]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, topic: queryTopic }));
  }, [queryTopic]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setNoticeType(null);

    const trimmed = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      topic: form.topic,
      subject: form.subject.trim(),
      message: form.message.trim(),
      website: form.website.trim(),
    };

    if (
      !trimmed.name ||
      !trimmed.email ||
      !trimmed.subject ||
      !trimmed.message
    ) {
      setNotice("Please complete all required fields.");
      setNoticeType("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      setNotice("Please enter a valid email address.");
      setNoticeType("error");
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...trimmed,
          source: embedded ? "admin_console" : "public_contact",
          account_email: user?.email ?? null,
          page_url: window.location.href,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setNotice(result?.error ?? "Could not send your message.");
        setNoticeType("error");
        return;
      }

      setForm((prev) => ({
        ...emptyForm(prev.topic),
        name: prev.name,
        email: prev.email,
      }));
      setNotice("Thank you — your message has been sent.");
      setNoticeType("success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={
        embedded
          ? "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm shadow-slate-900/[0.03] sm:p-6"
          : "rounded-2xl border border-[#e7e1d3] bg-white p-5 text-[#1c2b26] shadow-xl shadow-[#0a3d30]/10 sm:p-7"
      }
    >
      <div className="mb-5">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
            embedded ? "text-emerald-700" : "text-[#9a8c68]"
          }`}
        >
          Support
        </p>
        <h1
          className={`mt-2 font-semibold ${
            embedded
              ? "text-2xl text-slate-900"
              : "font-display text-3xl text-[#1c2b26]"
          }`}
        >
          Send us a message
        </h1>
        <p
          className={`mt-2 text-sm leading-6 ${
            embedded ? "text-slate-500" : "text-[#6b7a74]"
          }`}
        >
          We'll reply to the email address you provide below.
        </p>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-xl border px-3 py-2 text-xs ${
            noticeType === "success"
              ? embedded
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-[#0f5c46]/25 bg-[#0f5c46]/[0.06] text-[#0a3d30]"
              : embedded
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {notice}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <input
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => setField("website", event.target.value)}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              className={inputClass}
              value={form.name}
              maxLength={120}
              onChange={(event) => setField("name", event.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              className={inputClass}
              type="email"
              value={form.email}
              maxLength={320}
              onChange={(event) => setField("email", event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <label className={labelClass}>Topic *</label>
            <select
              className={inputClass}
              value={form.topic}
              onChange={(event) =>
                setField("topic", event.target.value as ContactTopic)
              }
            >
              {contactTopics.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Subject *</label>
            <input
              className={inputClass}
              value={form.subject}
              maxLength={160}
              onChange={(event) => setField("subject", event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Message *</label>
          <textarea
            className={`${inputClass} min-h-40 resize-y`}
            value={form.message}
            maxLength={5000}
            onChange={(event) => setField("message", event.target.value)}
          />
          <div
            className={`mt-1 text-right text-[10px] ${
              embedded ? "text-slate-500" : "text-[#9a8c68]"
            }`}
          >
            {form.message.length}/5000
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={
            embedded
              ? "w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
              : "w-full rounded-xl bg-[#0f5c46] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/15 transition hover:bg-[#0a3d30] disabled:opacity-60"
          }
        >
          {submitting ? "Sending…" : "Send message"}
        </button>
      </form>
    </section>
  );
};

const ContactPage: React.FC = () => {
  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/contact");
    setPageSeo({
      title: "Contact UmmahWay | Support For Masjids And Worshippers",
      description:
        "Contact UmmahWay for account help, purchase questions, masjid listings, prayer timing updates, privacy requests, and technical support.",
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact UmmahWay",
        url: canonicalUrl,
        description:
          "Contact UmmahWay for account help, purchase questions, masjid listings, prayer timing updates, privacy requests, and technical support.",
        isPartOf: {
          "@type": "WebSite",
          name: "UmmahWay",
          url: "https://ummahway.com",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: SUPPORT_EMAIL,
          contactType: "customer support",
        },
      },
    });
  }, []);

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
                Support
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-[#d8cfb8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                Get in touch
              </p>
            </div>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">
              We're here to help
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#4a5852]">
              Questions about a purchase, your account, or masjid timings? Send
              us a note and we'll get back to you.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e1d3] bg-white p-4 text-sm shadow-sm">
            <div className="font-semibold text-[#0a3d30]">{SUPPORT_EMAIL}</div>
            <div className="mt-1 text-[#6b7a74]">
              Replies go to the email address in your message.
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#0a3d30] p-5 text-white">
            <p className="font-arabic text-lg text-[#e6cf9a]">
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              For prayer times and notices, visit your masjid's page — each one
              is kept current by its own team.
            </p>
          </div>
        </section>

        <ContactSupportPanel />
      </main>
    </div>
  );
};

function isContactTopic(value: string | null): value is ContactTopic {
  return contactTopics.some((topic) => topic.value === value);
}

export default ContactPage;
