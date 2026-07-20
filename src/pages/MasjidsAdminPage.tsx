import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Spinner,
} from "../components/ui";
import { MosqueIcon, CloseIcon } from "../components/icons";

type MasjidRow = {
  id: string;
  slug: string;
  official_name: string;
  short_name: string | null;
  city: string;
  region: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  timezone: string;
  is_active: boolean;
};

type MasjidForm = {
  id?: string;
  slug: string;
  official_name: string;
  short_name: string;
  city: string;
  region: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  timezone: string;
  is_active: boolean;
};

type FormMode = "create" | "edit" | null;

const emptyForm: MasjidForm = {
  slug: "",
  official_name: "",
  short_name: "",
  city: "",
  region: "",
  address_line1: "",
  address_line2: "",
  postal_code: "",
  timezone: "Europe/Rome",
  is_active: true,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

const MasjidsAdminPage: React.FC = () => {
  const [rows, setRows] = useState<MasjidRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [form, setForm] = useState<MasjidForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --------------------------------------------------
  // Load existing masjids
  // --------------------------------------------------
  const fetchMasjids = async (): Promise<{
    rows: MasjidRow[];
    errorMsg: string | null;
  }> => {
    const { data, error } = await supabase
      .from("public_masjids")
      .select(
        `
        id,
        slug,
        official_name,
        short_name,
        city,
        region,
        address_line1,
        address_line2,
        postal_code,
        timezone,
        is_active
      `
      )
      .order("city", { ascending: true });

    if (error) {
      console.error("Error loading masjids", error);
      return { rows: [], errorMsg: error.message };
    }

    return { rows: (data as MasjidRow[]) ?? [], errorMsg: null };
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { rows, errorMsg } = await fetchMasjids();
      if (cancelled) return;

      if (errorMsg) {
        setError(errorMsg);
        setRows([]);
      } else {
        setRows(rows);
      }

      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    const { rows, errorMsg } = await fetchMasjids();
    if (errorMsg) {
      setError(errorMsg);
      setRows([]);
    } else {
      setRows(rows);
    }
    setLoading(false);
  };

  // --------------------------------------------------
  // Form handlers
  // --------------------------------------------------
  const openCreateForm = () => {
    setFormMode("create");
    setForm(emptyForm);
    setError(null);
    setSuccessMsg(null);
  };

  const openEditForm = (row: MasjidRow) => {
    setFormMode("edit");
    setError(null);
    setSuccessMsg(null);

    setForm({
      id: row.id,
      slug: row.slug ?? "",
      official_name: row.official_name ?? "",
      short_name: row.short_name ?? "",
      city: row.city ?? "",
      region: row.region ?? "",
      address_line1: row.address_line1 ?? "",
      address_line2: row.address_line2 ?? "",
      postal_code: row.postal_code ?? "",
      timezone: row.timezone ?? "Europe/Rome",
      is_active: row.is_active,
    });
  };

  const closeForm = () => {
    setFormMode(null);
    setForm(emptyForm);
  };

  const handleChange = (
    field: keyof MasjidForm,
    value: string | boolean
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from official_name on CREATE
      if (field === "official_name" && formMode === "create") {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  // --------------------------------------------------
  // Save (create / update)
  // --------------------------------------------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!form.official_name.trim()) {
      setError("Official name is required.");
      return;
    }
    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    const slug = (form.slug || slugify(form.official_name)).trim();
    if (!slug) {
      setError("Slug could not be generated – please enter a slug manually.");
      return;
    }

    const payload = {
      slug,
      official_name: form.official_name.trim(),
      short_name: form.short_name.trim() || null,
      city: form.city.trim(),
      region: form.region.trim() || null,
      address_line1: form.address_line1.trim() || null,
      address_line2: form.address_line2.trim() || null,
      postal_code: form.postal_code.trim() || null,
      timezone: form.timezone.trim() || "Europe/Rome",
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (formMode === "create") {
        const { data, error } = await supabase
          .from("public_masjids")
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          console.error(error);
          setError(error.message);
        } else if (data) {
          const newRow = data as MasjidRow;
          setRows((prev) => [newRow, ...prev]);
          setSuccessMsg("Masjid created successfully.");
          closeForm();
        }
      } else if (formMode === "edit" && form.id) {
        const { data, error } = await supabase
          .from("public_masjids")
          .update(payload)
          .eq("id", form.id)
          .select("*")
          .single();

        if (error) {
          console.error(error);
          setError(error.message);
        } else if (data) {
          const updated = data as MasjidRow;
          setRows((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          setSuccessMsg("Masjid updated successfully.");
          closeForm();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Toggle active
  // --------------------------------------------------
  const handleToggleActive = async (row: MasjidRow) => {
    setUpdatingActiveId(row.id);
    setError(null);
    setSuccessMsg(null);

    const { data, error } = await supabase
      .from("public_masjids")
      .update({ is_active: !row.is_active })
      .eq("id", row.id)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
    } else if (data) {
      const updated = data as MasjidRow;
      setRows((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    }

    setUpdatingActiveId(null);
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  const activeCount = rows.filter((r) => r.is_active).length;

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15";

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {successMsg && <Alert tone="success">{successMsg}</Alert>}

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              Masjid directory
            </span>
            <Badge tone="emerald">{rows.length} total</Badge>
            <Badge tone="slate">{activeCount} active</Badge>
            {loading && <Spinner />}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => void handleRefresh()}>
              Refresh
            </Button>
            <Button size="sm" onClick={openCreateForm}>
              + Add masjid
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<MosqueIcon />}
              title="No masjids yet"
              description="Use “Add masjid” to onboard your first community and make it visible in the app."
              action={<Button size="sm" onClick={openCreateForm}>+ Add masjid</Button>}
            />
          </div>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-[760px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Slug / Timezone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => (
                  <tr key={m.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3 align-middle">
                      <div className="font-semibold text-slate-900">
                        {m.official_name}
                      </div>
                      {m.short_name && (
                        <div className="text-xs text-slate-500">
                          {m.short_name}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 align-middle text-slate-700">
                      <div>{m.city}</div>
                      {m.region && (
                        <div className="text-xs text-slate-500">{m.region}</div>
                      )}
                      {(m.address_line1 || m.postal_code) && (
                        <div className="text-xs text-slate-400">
                          {m.address_line1}
                          {m.postal_code && ` • ${m.postal_code}`}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                        {m.slug}
                      </code>
                      <div className="mt-1 text-xs text-slate-400">
                        {m.timezone}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      {m.is_active ? (
                        <Badge tone="emerald">Active</Badge>
                      ) : (
                        <Badge tone="slate">Hidden</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditForm(m)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={m.is_active ? "danger" : "subtle"}
                          disabled={updatingActiveId === m.id}
                          onClick={() => void handleToggleActive(m)}
                        >
                          {updatingActiveId === m.id
                            ? "…"
                            : m.is_active
                            ? "Hide in app"
                            : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-over / panel for form */}
      {formMode && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeForm}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {formMode === "create" ? "Add masjid" : "Edit masjid"}
                </h3>
                <p className="text-xs text-slate-500">
                  Basic profile used in the app and Ramadan tools.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <form
              id="masjid-form"
              onSubmit={handleSave}
              className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
            >
              <Field label="Official name *">
                <input
                  type="text"
                  value={form.official_name}
                  onChange={(e) => handleChange("official_name", e.target.value)}
                  className={inputCls}
                  placeholder="Centro Islamico di Bolzano"
                />
              </Field>

              <Field label="Short name">
                <input
                  type="text"
                  value={form.short_name}
                  onChange={(e) => handleChange("short_name", e.target.value)}
                  className={inputCls}
                  placeholder="Bolzano mosque"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City *">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={inputCls}
                    placeholder="Bolzano"
                  />
                </Field>
                <Field label="Region / province">
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                    className={inputCls}
                    placeholder="Alto Adige"
                  />
                </Field>
              </div>

              <Field label="Address line 1">
                <input
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => handleChange("address_line1", e.target.value)}
                  className={inputCls}
                  placeholder="Via Example 12"
                />
              </Field>

              <Field label="Address line 2">
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => handleChange("address_line2", e.target.value)}
                  className={inputCls}
                  placeholder="(optional)"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Postal code">
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => handleChange("postal_code", e.target.value)}
                    className={inputCls}
                    placeholder="39100"
                  />
                </Field>
                <Field label="Timezone *">
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className={inputCls}
                    placeholder="Europe/Rome"
                  />
                </Field>
              </div>

              <Field
                label="Slug *"
                hint="Used in URLs and internal references. No spaces, lowercase."
              >
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className={inputCls}
                  placeholder="bolzano-masjid"
                />
              </Field>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">Visible in mobile app</span>
              </label>
            </form>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" form="masjid-form" disabled={saving}>
                {saving
                  ? "Saving…"
                  : formMode === "create"
                  ? "Create masjid"
                  : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasjidsAdminPage;
