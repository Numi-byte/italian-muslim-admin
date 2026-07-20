import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";

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

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400";
const labelClass = "mb-1 block text-[11px] font-semibold text-slate-300";

export const ContactSupportPanel: React.FC<ContactSupportPanelProps> = ({
  embedded = false,
  defaultTopic = "purchase",
}) => {
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
      setNotice(`Message received for ${SUPPORT_EMAIL}.`);
      setNoticeType("success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`rounded-lg border border-slate-800 bg-slate-950 p-5 text-slate-100 ${
        embedded ? "" : "shadow-2xl shadow-black/20"
      }`}
    >
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
          Support
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Contact UmmahWay
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Messages are received for {SUPPORT_EMAIL}.
        </p>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-md border px-3 py-2 text-xs ${
            noticeType === "success"
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/60 bg-red-500/10 text-red-200"
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
          <div className="mt-1 text-right text-[10px] text-slate-500">
            {form.message.length}/5000
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
};

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-[8px]" />
            <div>
              <div className="text-sm font-semibold text-white">UmmahWay</div>
              <div className="text-[10px] text-slate-400">Support</div>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Direct contact
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Purchase, account, and masjid timing support.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Use one form for subscriptions, one-time purchases, login access,
              and Jamaah timing accounts.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <div className="font-semibold text-white">{SUPPORT_EMAIL}</div>
            <div className="mt-1 text-slate-400">
              Replies are sent to the email address in your message.
            </div>
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
