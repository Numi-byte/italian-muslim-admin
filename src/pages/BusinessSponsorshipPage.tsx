import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

type Payload = FormState & {
  source: "website";
  status: "new";
};

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
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400";

const labelClass = "mb-1 block text-[11px] font-medium text-slate-300";

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
      source: "website",
      status: "new",
    };

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("business_sponsorship_applications")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      const { error: functionError } = await supabase.functions.invoke(
        "business-sponsorship-request",
        {
          body: { ...payload, id: data?.id },
        }
      );

      if (functionError) {
        setMessage(functionError.message);
        setMessageType("error");
        return;
      }

      setForm(initialForm);
      setMessage("Application sent. We will contact you shortly.");
      setMessageType("success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-slate-950">
              UW
            </div>
            <div>
              <div className="text-sm font-semibold text-white">UmmahWay</div>
              <div className="text-[10px] text-slate-400">
                Business sponsorship
              </div>
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
              Reach the community
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Sponsor a helpful offer inside UmmahWay.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Tell us about your business, the audience you want to reach, and
              the offer you would like to promote on the Prayers page.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            Short mobile titles work best. We review every sponsor before an ad
            is published so the app stays useful and respectful for worshippers.
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          {message && (
            <div
              className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
                messageType === "success"
                  ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/70 bg-red-500/10 text-red-200"
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
                  placeholder="Restaurant, school, service..."
                />
              </div>
              <div>
                <label className={labelClass}>Target audience *</label>
                <input
                  className={textInput}
                  value={form.target_audience}
                  onChange={(e) => setField("target_audience", e.target.value)}
                  placeholder="Families, students, commuters..."
                />
              </div>
              <div>
                <label className={labelClass}>Offer type *</label>
                <input
                  className={textInput}
                  value={form.offer_type}
                  onChange={(e) => setField("offer_type", e.target.value)}
                  placeholder="Discount, event, service launch..."
                />
              </div>
              <div>
                <label className={labelClass}>Budget range *</label>
                <input
                  className={textInput}
                  value={form.budget_range}
                  onChange={(e) => setField("budget_range", e.target.value)}
                  placeholder="Example: 100-250 EUR"
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
                  placeholder="Two weeks, one month, Ramadan..."
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
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Submit sponsorship application"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default BusinessSponsorshipPage;
