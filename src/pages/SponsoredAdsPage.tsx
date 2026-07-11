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
  website_url: string | null;
  business_type: string | null;
  target_audience: string | null;
  offer_type: string | null;
  budget_range: string | null;
  preferred_duration: string | null;
  notes: string | null;
  source: string | null;
  status: string | null;
  business_category: string | null;
  business_model: string | null;
  business_description: string | null;
  year_established: number | null;
  phone_country: string | null;
  phone_country_code: string | null;
  phone_local_number: string | null;
  postal_code: string | null;
  products_services: string | null;
  halal_certification_status: string | null;
  offer_details: string | null;
  additional_info: string | null;
  preferred_placement: string | null;
  heard_about: string | null;
  logo_image_url: string | null;
  logo_image_path: string | null;
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
  image_path: string | null;
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

const sponsoredAdsBucket = "prayer-sponsored-ads";
const maxImageSizeBytes = 5 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const present = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const joinPresent = (
  values: (string | number | null | undefined)[],
  separator = " - "
) => values.map(present).filter(Boolean).join(separator);

const phoneForApplication = (app: SponsorshipApplication) =>
  present(app.contact_phone) ||
  joinPresent([app.phone_country_code, app.phone_local_number], " ") ||
  null;

const applicationSearchValues = (app: SponsorshipApplication) => [
  app.id,
  app.business_name,
  app.contact_name,
  app.contact_email,
  app.contact_phone,
  app.phone_country,
  app.phone_country_code,
  app.phone_local_number,
  app.city,
  app.postal_code,
  app.website_url,
  app.business_type,
  app.business_category,
  app.business_model,
  app.business_description,
  app.year_established,
  app.target_audience,
  app.products_services,
  app.halal_certification_status,
  app.offer_type,
  app.offer_details,
  app.budget_range,
  app.preferred_duration,
  app.preferred_placement,
  app.heard_about,
  app.notes,
  app.additional_info,
  app.source,
  app.status,
];

const applicationDetailGroups = (app: SponsorshipApplication) => [
  {
    title: "Business",
    rows: [
      ["Category", app.business_category],
      ["Model", app.business_model],
      ["Type", app.business_type],
      ["Established", app.year_established],
      ["Description", app.business_description],
      ["Products/services", app.products_services],
      ["Halal certification", app.halal_certification_status],
    ],
  },
  {
    title: "Contact",
    rows: [
      ["Name", app.contact_name],
      ["Email", app.contact_email],
      ["Phone", phoneForApplication(app)],
      ["Phone country", app.phone_country],
      ["Website", app.website_url],
    ],
  },
  {
    title: "Location",
    rows: [
      ["City", app.city],
      ["Postal code", app.postal_code],
    ],
  },
  {
    title: "Sponsorship",
    rows: [
      ["Offer type", app.offer_type],
      ["Offer details", app.offer_details],
      ["Budget range", app.budget_range],
      ["Preferred duration", app.preferred_duration],
      ["Preferred placement", app.preferred_placement],
      ["Target audience", app.target_audience],
      ["Heard about", app.heard_about],
    ],
  },
  {
    title: "Extra",
    rows: [
      ["Notes", app.notes],
      ["Additional info", app.additional_info],
      ["Logo path", app.logo_image_path],
    ],
  },
];

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
  const [editingAd, setEditingAd] = useState<SponsoredAd | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
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

      return applicationSearchValues(app)
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [applications, applicationSearch, applicationStatusFilter]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setForm(initialForm);
    setEditingAd(null);
    setImageFile(null);
    setImageInputKey((prev) => prev + 1);
  };

  const editAd = (ad: SponsoredAd) => {
    setEditingAd(ad);
    setImageFile(null);
    setImageInputKey((prev) => prev + 1);
    setMessage(null);
    setMessageType(null);
    setForm({
      application_id: ad.application_id ?? "",
      masjid_id: ad.masjid_id ?? "",
      status: ad.status,
      priority: String(ad.priority ?? 0),
      business_name: ad.business_name ?? "",
      title: ad.title,
      subtitle: ad.subtitle ?? "",
      description: ad.description ?? "",
      cta_label: ad.cta_label ?? "",
      target_url: ad.target_url ?? "",
      image_url: ad.image_url ?? "",
      discount_label: ad.discount_label ?? "",
      starts_on: ad.starts_on,
      ends_on: ad.ends_on ?? "",
    });
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    setMessageType(null);

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setImageFile(null);
      setMessage("Image must be a JPG, PNG, or WebP file.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setImageFile(null);
      setMessage("Image must be smaller than 5 MB.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  };

  const uploadImage = async (file: File) => {
    const extension = imageExtensions[file.type] ?? "webp";
    const safeBusinessName =
      form.business_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      "sponsored-ad";
    const objectPath = `${user?.id ?? "admin"}/${Date.now()}-${safeBusinessName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(sponsoredAdsBucket)
      .upload(objectPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(sponsoredAdsBucket)
      .getPublicUrl(objectPath);

    return {
      imageUrl: data.publicUrl,
      imagePath: objectPath,
    };
  };

  const applyApplicationForAd = (app: SponsorshipApplication) => {
    const subtitle =
      app.offer_type ||
      app.business_category ||
      app.business_model ||
      app.business_type ||
      "";
    const description = [
      app.offer_details,
      app.business_description,
      app.products_services,
      joinPresent([app.city, app.postal_code]),
      app.halal_certification_status
        ? `Halal certification: ${app.halal_certification_status}`
        : null,
      app.budget_range ? `Budget: ${app.budget_range}` : null,
      app.preferred_duration
        ? `Preferred duration: ${app.preferred_duration}`
        : null,
      app.preferred_placement
        ? `Preferred placement: ${app.preferred_placement}`
        : null,
    ]
      .map(present)
      .filter(Boolean)
      .join("\n\n");

    setForm((prev) => ({
      ...prev,
      application_id: app.id,
      business_name: prev.business_name || app.business_name,
      title: prev.title || app.offer_type || app.business_name,
      subtitle: prev.subtitle || subtitle,
      description: prev.description || description,
      target_url: prev.target_url || app.website_url || "",
      image_url: prev.image_url || app.logo_image_url || "",
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
          "id, application_id, masjid_id, placement, status, priority, title, subtitle, description, cta_label, target_url, image_url, image_path, discount_label, business_name, starts_on, ends_on, created_at"
        )
        .eq("placement", "prayers_home")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("business_sponsorship_applications")
        .select(
          "id, business_name, contact_name, contact_email, contact_phone, city, website_url, business_type, target_audience, offer_type, budget_range, preferred_duration, notes, source, status, business_category, business_model, business_description, year_established, phone_country, phone_country_code, phone_local_number, postal_code, products_services, halal_certification_status, offer_details, additional_info, preferred_placement, heard_about, logo_image_url, logo_image_path, created_at"
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

    setSaving(true);
    try {
      const uploadedImage = imageFile ? await uploadImage(imageFile) : null;
      const nextImageUrl =
        uploadedImage?.imageUrl ?? (form.image_url.trim() || null);
      const nextImagePath = uploadedImage
        ? uploadedImage.imagePath
        : editingAd && nextImageUrl === editingAd.image_url
          ? editingAd.image_path
          : null;
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
        image_url: nextImageUrl,
        image_path: nextImagePath,
        discount_label: form.discount_label.trim() || null,
        starts_on: form.starts_on,
        ends_on: form.ends_on || null,
      };

      const { error } = editingAd
        ? await supabase
            .from("prayer_sponsored_ads")
            .update(payload)
            .eq("id", editingAd.id)
        : await supabase.from("prayer_sponsored_ads").insert(payload);

      if (error) {
        if (uploadedImage?.imagePath) {
          await supabase.storage
            .from(sponsoredAdsBucket)
            .remove([uploadedImage.imagePath]);
        }
        setMessage(error.message);
        setMessageType("error");
      } else {
        if (
          editingAd?.image_path &&
          editingAd.image_path !== nextImagePath
        ) {
          await supabase.storage
            .from(sponsoredAdsBucket)
            .remove([editingAd.image_path]);
        }
        clearForm();
        setMessage(editingAd ? "Sponsored ad updated." : "Sponsored ad created.");
        setMessageType("success");
        await loadData();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not upload the image."
      );
      setMessageType("error");
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
      setEditingAd((prev) => (prev?.id === id ? { ...prev, status } : prev));
      if (editingAd?.id === id) {
        setField("status", status);
      }
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
              {editingAd ? "Edit sponsored ad" : "New sponsored ad"}
            </h3>
            <p className="text-[11px] text-slate-500">
              {editingAd
                ? "Changes update the existing mobile ad."
                : "Keep titles short enough for one mobile line."}
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
              <label className={labelClass}>Upload image</label>
              <input
                key={imageInputKey}
                className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:text-slate-100`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
              />
              <p className="mt-1 text-[10px] text-slate-500">
                JPG, PNG, or WebP. Max 5 MB. Uploaded to{" "}
                <span className="font-mono text-slate-400">
                  {sponsoredAdsBucket}
                </span>
                .
              </p>
              {imageFile && (
                <p className="mt-1 text-[10px] text-emerald-300">
                  Ready to upload: {imageFile.name}
                </p>
              )}
              {editingAd?.image_path && !imageFile && (
                <p className="mt-1 text-[10px] text-slate-500">
                  Current storage path:{" "}
                  <span className="font-mono text-slate-400">
                    {editingAd.image_path}
                  </span>
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Image URL fallback</label>
              <input
                className={inputClass}
                type="url"
                value={form.image_url}
                onChange={(e) => setField("image_url", e.target.value)}
                placeholder="Optional legacy public image URL"
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
              onClick={clearForm}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-900"
            >
              {editingAd ? "Cancel edit" : "Clear"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-emerald-950 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingAd
                  ? "Save changes"
                  : "Create ad"}
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
              <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {filteredApplications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => applyApplicationForAd(app)}
                    className={`w-full rounded-lg border p-3 text-left hover:bg-slate-900 ${
                      form.application_id === app.id
                        ? "border-emerald-500/70 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    {app.logo_image_url && (
                      <img
                        src={app.logo_image_url}
                        alt=""
                        className="mb-3 h-24 w-full rounded-md border border-slate-800 object-cover"
                      />
                    )}
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
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-300">
                      {[
                        app.business_category,
                        app.business_model,
                        app.halal_certification_status
                          ? `Halal: ${app.halal_certification_status}`
                          : null,
                        app.preferred_placement,
                        app.source ?? "unknown source",
                        app.created_at.slice(0, 10),
                      ]
                        .map(present)
                        .filter(Boolean)
                        .map((value) => (
                          <span
                            key={value}
                            className="rounded-full bg-slate-900 px-2 py-0.5"
                          >
                            {value}
                          </span>
                        ))}
                    </div>
                    <div className="mt-3 space-y-3">
                      {applicationDetailGroups(app).map((group) => {
                        const rows = group.rows.filter(([, value]) =>
                          present(value)
                        );
                        if (rows.length === 0) return null;

                        return (
                          <div key={group.title}>
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {group.title}
                            </div>
                            <dl className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
                              {rows.map(([label, value]) => (
                                <div key={label} className="min-w-0">
                                  <dt className="text-[10px] text-slate-500">
                                    {label}
                                  </dt>
                                  <dd className="break-words text-[11px] text-slate-300">
                                    {present(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        );
                      })}
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
                    {ad.image_url && (
                      <div className="mt-3 flex gap-3 rounded-md border border-slate-800 bg-slate-900/50 p-2">
                        <img
                          src={ad.image_url}
                          alt=""
                          className="h-16 w-24 rounded object-cover"
                        />
                        <div className="min-w-0 text-[10px] text-slate-500">
                          <div className="truncate text-slate-300">
                            {ad.image_path ?? "External image URL"}
                          </div>
                          <a
                            href={ad.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-emerald-300 hover:text-emerald-200"
                          >
                            {ad.image_url}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editAd(ad)}
                        className="rounded-full border border-emerald-500/60 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Edit
                      </button>
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
