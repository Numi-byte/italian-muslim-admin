import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabaseClient";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type SponsorshipApplication = {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  business_type: string | null;
  offer_type: string | null;
  budget_range: string | null;
  preferred_duration: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
};

type AdStatus = "draft" | "active" | "paused" | "expired" | "archived";

type SponsoredAd = {
  id: string;
  application_id: string | null;
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
  const { profile, user } = useAuth();
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [applications, setApplications] = useState<SponsorshipApplication[]>(
    []
  );
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationStatusFilter, setApplicationStatusFilter] =
    useState("all");
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null
  );
  const [adsError, setAdsError] = useState<string | null>(null);
  const [masjidsError, setMasjidsError] = useState<string | null>(null);
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

  const filteredApplications = useMemo(() => {
    const query = applicationSearch.trim().toLowerCase();

    return applications.filter((app) => {
      const statusMatches =
        applicationStatusFilter === "all" ||
        app.status === applicationStatusFilter;
      if (!statusMatches) return false;

      if (!query) return true;

      return [
        app.id,
        app.business_name,
        app.contact_name,
        app.contact_email,
        app.contact_phone,
        app.city,
        app.business_type,
        app.offer_type,
        app.budget_range,
        app.preferred_duration,
        app.source,
        app.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [applications, applicationSearch, applicationStatusFilter]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const useApplicationForAd = (app: SponsorshipApplication) => {
    setForm((prev) => ({
      ...prev,
      application_id: app.id,
      business_name: prev.business_name || app.business_name,
      subtitle: prev.subtitle || app.offer_type || "",
      description:
        prev.description ||
        [
          app.business_type,
          app.city,
          app.budget_range ? `Budget: ${app.budget_range}` : null,
          app.preferred_duration
            ? `Preferred duration: ${app.preferred_duration}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
    }));
  };

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    setMessageType(null);
    setApplicationsError(null);
    setAdsError(null);
    setMasjidsError(null);

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
        .select(
          "id, business_name, contact_name, contact_email, contact_phone, city, business_type, offer_type, budget_range, preferred_duration, source, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("public_masjids")
        .select("id, official_name, city")
        .order("city", { ascending: true }),
    ]);

    if (adsResult.error) {
      setAdsError(adsResult.error.message);
      setAds([]);
    } else {
      setAds((adsResult.data ?? []) as SponsoredAd[]);
    }

    if (appsResult.error) {
      setApplicationsError(appsResult.error.message);
      setApplications([]);
    } else {
      setApplications((appsResult.data ?? []) as SponsorshipApplication[]);
    }

    if (masjidsResult.error) {
      setMasjidsError(masjidsResult.error.message);
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
      application_id: form.application_id || null,
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

  const updateStatus = async (id: string, status: AdStatus) => {
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
              <label className={labelClass}>Application UUID</label>
              <input
                className={inputClass}
                value={form.application_id}
                onChange={(e) => setField("application_id", e.target.value)}
                placeholder="Paste UUID or choose a lead on the right"
              />
              {selectedApplication && (
                <p className="mt-1 text-[10px] text-emerald-300">
                  Linked to {selectedApplication.business_name}
                </p>
              )}
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
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
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

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Sponsorship leads
                </h3>
                <p className="text-[11px] text-slate-500">
                  Website and mobile applications from the sponsorship table.
                </p>
              </div>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] text-slate-300">
                {applications.length}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className={inputClass}
                value={applicationSearch}
                onChange={(e) => setApplicationSearch(e.target.value)}
                placeholder="Search business, city, email, phone, UUID..."
              />
              <select
                className={inputClass}
                value={applicationStatusFilter}
                onChange={(e) => setApplicationStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {applicationsError ? (
              <div className="mt-3 rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-red-200">
                Could not read sponsorship applications: {applicationsError}
                <div className="mt-2 text-[11px] text-red-100/80">
                  Run the super-admin sponsorship RLS SQL. This area checks
                  profiles.role = super_admin or the configured owner user id,
                  and does not use digital_register_users.
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-700 p-4 text-slate-400">
                No applications are visible to this admin account. If mobile
                submissions exist, this is usually a sponsorship RLS mismatch
                for the super_admin profile or the rows are in a different
                Supabase project.
                <div className="mt-3 rounded-md bg-slate-900/80 p-2 font-mono text-[10px] text-slate-500">
                  signed in: {user?.email ?? "unknown"} · profile role:{" "}
                  {profile?.role ?? "none"}
                </div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-700 p-4 text-slate-400">
                No applications match this search.
              </div>
            ) : (
              <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {filteredApplications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => useApplicationForAd(app)}
                    className={`w-full rounded-lg border p-3 text-left hover:bg-slate-900 ${
                      form.application_id === app.id
                        ? "border-emerald-500/70 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-100">
                          {app.business_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.city ?? "No city"} ·{" "}
                          {app.contact_name ?? "No contact"}
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                        {app.status ?? "new"}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {app.offer_type ?? "No offer type"} ·{" "}
                      {app.source ?? "unknown source"} ·{" "}
                      {app.created_at.slice(0, 10)}
                    </div>
                    <div className="mt-1 truncate font-mono text-[10px] text-slate-600">
                      {app.id}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">
              Existing ads
            </h3>
            {adsError && (
              <div className="mb-3 rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-red-200">
                Could not read sponsored ads: {adsError}
              </div>
            )}
            {masjidsError && (
              <div className="mb-3 rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-red-200">
                Could not read masjids: {masjidsError}
              </div>
            )}
            {ads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 p-4 text-slate-400">
                No sponsored ads yet.
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
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
                            : ad.status === "expired" ||
                              ad.status === "archived"
                            ? "bg-slate-800 text-slate-300"
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
                      {(
                        [
                          "draft",
                          "paused",
                          "active",
                          "expired",
                          "archived",
                        ] as AdStatus[]
                      ).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => void updateStatus(ad.id, status)}
                          className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-900 disabled:opacity-40"
                          disabled={ad.status === status}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsoredAdsPage;
