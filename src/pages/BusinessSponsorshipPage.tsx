import React, { useState } from "react";
import { Link } from "react-router-dom";

type FormState = {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  website_url: string;
  business_type: string;
  target_audience: string;
  offer_type: string;
  budget_range: string;
  preferred_duration: string;
  notes: string;
};

type Payload = FormState;

const initialForm: FormState = {
  business_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  city: "",
  website_url: "",
  business_type: "",
  target_audience: "",
  offer_type: "",
  budget_range: "",
  preferred_duration: "",
  notes: "",
};

const requiredFields: (keyof FormState)[] = [
  "business_name",
  "contact_name",
  "contact_email",
  "contact_phone",
  "city",
  "business_type",
  "target_audience",
  "offer_type",
  "budget_range",
  "preferred_duration",
];

const textInput =
  "w-full rounded-xl border border-[#e7e1d3] bg-[#faf8f1] px-3.5 py-2.5 text-sm text-[#1c2b26] outline-none transition placeholder:text-[#b0a483] focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#9a8c68]";

const BusinessSponsorshipPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    const missing = requiredFields.find((field) => !form[field].trim());
    if (missing) {
      setMessage("Please complete all required fields before submitting.");
      setMessageType("error");
      return;
    }

    const payload: Payload = {
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim(),
      city: form.city.trim(),
      website_url: form.website_url.trim(),
      business_type: form.business_type.trim(),
      target_audience: form.target_audience.trim(),
      offer_type: form.offer_type.trim(),
      budget_range: form.budget_range.trim(),
      preferred_duration: form.preferred_duration.trim(),
      notes: form.notes.trim(),
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/business-sponsorship", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.error ?? "Could not submit application.");
        setMessageType("error");
        return;
      }

      setForm(initialForm);
      setMessage("Application sent. We'll be in touch shortly.");
      setMessageType("success");
    } finally {
      setSubmitting(false);
    }
  };

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
                Sponsorship
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
                Reach the community
              </p>
            </div>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">
              Sponsor a helpful offer
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#4a5852]">
              Tell us about your business, who you'd like to reach, and the offer
              you'd like to share on the Prayers page.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e1d3] bg-white p-4 text-sm leading-6 text-[#4a5852] shadow-sm">
            Short, clear titles work best on mobile. Every sponsor is reviewed
            before an ad goes live, so the app stays useful and respectful for
            worshippers.
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#0a3d30] p-5 text-white">
            <p className="font-arabic text-lg text-[#e6cf9a]">
              وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Support the community and reach families, students and visitors
              across the masjids you care about.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e7e1d3] bg-white p-5 shadow-xl shadow-[#0a3d30]/10 sm:p-7">
          {message && (
            <div
              className={`mb-4 rounded-xl border px-3 py-2 text-xs ${
                messageType === "success"
                  ? "border-[#0f5c46]/25 bg-[#0f5c46]/[0.06] text-[#0a3d30]"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Business name *</label>
                <input
                  className={textInput}
                  value={form.business_name}
                  onChange={(e) => setField("business_name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>City *</label>
                <input
                  className={textInput}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Contact name *</label>
                <input
                  className={textInput}
                  value={form.contact_name}
                  onChange={(e) => setField("contact_name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Phone *</label>
                <input
                  className={textInput}
                  value={form.contact_phone}
                  onChange={(e) => setField("contact_phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  className={textInput}
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setField("contact_email", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  className={textInput}
                  type="url"
                  value={form.website_url}
                  onChange={(e) => setField("website_url", e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className={labelClass}>Business type *</label>
                <input
                  className={textInput}
                  value={form.business_type}
                  onChange={(e) => setField("business_type", e.target.value)}
                  placeholder="Restaurant, school, service…"
                />
              </div>
              <div>
                <label className={labelClass}>Target audience *</label>
                <input
                  className={textInput}
                  value={form.target_audience}
                  onChange={(e) => setField("target_audience", e.target.value)}
                  placeholder="Families, students, commuters…"
                />
              </div>
              <div>
                <label className={labelClass}>Offer type *</label>
                <input
                  className={textInput}
                  value={form.offer_type}
                  onChange={(e) => setField("offer_type", e.target.value)}
                  placeholder="Discount, event, service launch…"
                />
              </div>
              <div>
                <label className={labelClass}>Budget range *</label>
                <input
                  className={textInput}
                  value={form.budget_range}
                  onChange={(e) => setField("budget_range", e.target.value)}
                  placeholder="Example: 100–250 EUR"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Preferred duration *</label>
                <input
                  className={textInput}
                  value={form.preferred_duration}
                  onChange={(e) =>
                    setField("preferred_duration", e.target.value)
                  }
                  placeholder="Two weeks, one month, Ramadan…"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                className={`${textInput} min-h-24 resize-none`}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#0f5c46] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/15 transition hover:bg-[#0a3d30] disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Submit sponsorship application"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default BusinessSponsorshipPage;
