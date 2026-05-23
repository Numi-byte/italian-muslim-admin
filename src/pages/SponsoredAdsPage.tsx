import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type SponsorshipApplication = {
  id: number;
  business_name: string;
  contact_name: string | null;
  city: string | null;
  status: string | null;
  created_at: string;
};

type AdStatus = "draft" | "active" | "paused";

type SponsoredAd = {
  id: number;
  application_id: number | null;
  masjid_id: string | null;
  placement: "prayers_home";
  status: AdStatus;
  priority: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  cta_label: string | null;
  target_url: string | null;
  image_url: string | null;
  discount_label: string | null;
  business_name: string | null;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
};

type FormState = {
  application_id: string;
  masjid_id: string;
  status: AdStatus;
  priority: string;
  business_name: string;
  title: string;
  subtitle: string;
  description: string;
  cta_label: string;
  target_url: string;
  image_url: string;
  discount_label: string;
  starts_on: string;
  ends_on: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialForm: FormState = {
  application_id: "",
  masjid_id: "",
  status: "draft",
  priority: "0",
  business_name: "",
  title: "",
  subtitle: "",
  description: "",
  cta_label: "",
  target_url: "",
  image_url: "",
  discount_label: "",
  starts_on: today,
  ends_on: "",
};

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-400";

const labelClass = "mb-1 block text-[11px] text-slate-300";

const SponsoredAdsPage: React.FC = () => {
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [applications, setApplications] = useState<SponsorshipApplication[]>(
    []
  );
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const selectedApplication = useMemo(
    () =>
      applications.find((app) => String(app.id) === form.application_id) ??
      null,
    [applications, form.application_id]
  );

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    setMessageType(null);

    const [adsResult, appsResult, masjidsResult] = await Promise.all([
      supabase
        .from("prayer_sponsored_ads")
        .select(
          "id, application_id, masjid_id, placement, status, priority, title, subtitle, description, cta_label, target_url, image_url, discount_label, business_name, starts_on, ends_on, created_at"
        )
        .eq("placement", "prayers_home")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("business_sponsorship_applications")
        .select("id, business_name, contact_name, city, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("public_masjids")
        .select("id, official_name, city")
        .order("city", { ascending: true }),
    ]);

    if (adsResult.error) {
      setMessage(adsResult.error.message);
      setMessageType("error");
      setAds([]);
    } else {
      setAds((adsResult.data ?? []) as SponsoredAd[]);
    }

    if (appsResult.error) {
      setMessage(appsResult.error.message);
      setMessageType("error");
      setApplications([]);
    } else {
      setApplications((appsResult.data ?? []) as SponsorshipApplication[]);
    }

    if (masjidsResult.error) {
      setMessage(masjidsResult.error.message);
      setMessageType("error");
      setMasjids([]);
    } else {
      setMasjids((masjidsResult.data ?? []) as Masjid[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedApplication) return;
    setForm((prev) => ({
      ...prev,
      business_name: prev.business_name || selectedApplication.business_name,
    }));
  }, [selectedApplication]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!form.title.trim()) {
      setMessage("Ad title is required.");
      setMessageType("error");
      return;
    }

    if (!form.starts_on) {
      setMessage("Start date is required.");
      setMessageType("error");
      return;
    }

    const payload = {
      application_id: form.application_id ? Number(form.application_id) : null,
      masjid_id: form.masjid_id || null,
      placement: "prayers_home",
      status: form.status,
      priority: Number(form.priority) || 0,
      business_name: form.business_name.trim() || null,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      cta_label: form.cta_label.trim() || null,
      target_url: form.target_url.trim() || null,
      image_url: form.image_url.trim() || null,
      discount_label: form.discount_label.trim() || null,
      starts_on: form.starts_on,
      ends_on: form.ends_on || null,
    };

    setSaving(true);
    try {
      const { error } = await supabase
        .from("prayer_sponsored_ads")
        .insert(payload);

      if (error) {
        setMessage(error.message);
        setMessageType("error");
      } else {
        setForm(initialForm);
        setMessage("Sponsored ad created.");
        setMessageType("success");
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: number, status: AdStatus) => {
    setMessage(null);
    setMessageType(null);

    const { error } = await supabase
      .from("prayer_sponsored_ads")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setAds((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, status } : ad))
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Sponsored Prayers card
          </h2>
          <p className="text-xs text-slate-400">
            Create ads for the mobile app placement{" "}
            <span className="font-mono text-emerald-300">prayers_home</span>.
            App-wide ads leave masjid empty; active ads are eligible to publish.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="self-start rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            messageType === "success"
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/60 bg-red-500/10 text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">
              New sponsored ad
            </h3>
            <p className="text-[11px] text-slate-500">
              Keep titles short enough for one mobile line.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass}>Application</label>
              <select
                className={inputClass}
                value={form.application_id}
                onChange={(e) => setField("application_id", e.target.value)}
              >
                <option value="">No linked lead</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    #{app.id} - {app.business_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Masjid</label>
              <select
                className={inputClass}
                value={form.masjid_id}
                onChange={(e) => setField("masjid_id", e.target.value)}
              >
                <option value="">App-wide ad</option>
                {masjids.map((masjid) => (
                  <option key={masjid.id} value={masjid.id}>
                    {masjid.official_name} ({masjid.city})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setField("status", e.target.value as AdStatus)}
              >
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <input
                className={inputClass}
                type="number"
                value={form.priority}
                onChange={(e) => setField("priority", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Business name</label>
              <input
                className={inputClass}
                value={form.business_name}
                onChange={(e) => setField("business_name", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Title *</label>
              <input
                className={inputClass}
                maxLength={42}
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Halal lunch near you"
              />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <input
                className={inputClass}
                value={form.subtitle}
                onChange={(e) => setField("subtitle", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Discount label</label>
              <input
                className={inputClass}
                value={form.discount_label}
                onChange={(e) => setField("discount_label", e.target.value)}
                placeholder="10% off"
              />
            </div>
            <div>
              <label className={labelClass}>CTA label</label>
              <input
                className={inputClass}
                value={form.cta_label}
                onChange={(e) => setField("cta_label", e.target.value)}
                placeholder="View offer"
              />
            </div>
            <div>
              <label className={labelClass}>Target URL</label>
              <input
                className={inputClass}
                type="url"
                value={form.target_url}
                onChange={(e) => setField("target_url", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Image URL</label>
              <input
                className={inputClass}
                type="url"
                value={form.image_url}
                onChange={(e) => setField("image_url", e.target.value)}
                placeholder="Stable public image URL"
              />
            </div>
            <div>
              <label className={labelClass}>Starts on *</label>
              <input
                className={inputClass}
                type="date"
                value={form.starts_on}
                onChange={(e) => setField("starts_on", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Ends on</label>
              <input
                className={inputClass}
                type="date"
                value={form.ends_on}
                onChange={(e) => setField("ends_on", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-20 resize-none`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-900"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-emerald-950 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create ad"}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">
            Existing ads
          </h3>
          {ads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-4 text-slate-400">
              No sponsored ads yet.
            </div>
          ) : (
            <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-100">
                        {ad.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ad.business_name ?? "No business name"} - priority{" "}
                        {ad.priority}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        ad.status === "active"
                          ? "bg-emerald-500 text-emerald-950"
                          : ad.status === "paused"
                          ? "bg-amber-400 text-amber-950"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      {ad.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {ad.starts_on}
                    {ad.ends_on ? ` to ${ad.ends_on}` : " onward"} -{" "}
                    {ad.masjid_id ? "masjid-specific" : "app-wide"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["draft", "paused", "active"] as AdStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => void updateStatus(ad.id, status)}
                          className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-900 disabled:opacity-40"
                          disabled={ad.status === status}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SponsoredAdsPage;
