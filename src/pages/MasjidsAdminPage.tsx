import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Masjid directory
        </h2>
        <p className="text-sm text-slate-500">
          Onboard new masjids, update details and control which ones are
          visible in the app.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-xs text-red-800 px-3 py-2">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 px-3 py-2">
          {successMsg}
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white text-xs shadow-sm">
        {/* Header bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-950">Masjids</span>
            {loading && (
              <span className="text-[11px] text-slate-500">Loading…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-md bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-800"
            >
              + Add masjid
            </button>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-4 text-slate-500">
            No masjids yet. Use{" "}
            <span className="font-semibold text-slate-800">
              &ldquo;Add masjid&rdquo;
            </span>{" "}
            to onboard your first one.
          </div>
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-[760px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Location
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Slug / TZ
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-middle text-slate-900">
                      <div className="font-semibold">
                        {m.official_name}
                      </div>
                      {m.short_name && (
                        <div className="text-[11px] text-slate-500">
                          {m.short_name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-slate-700">
                      <div>{m.city}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.region ?? ""}
                      </div>
                      {(m.address_line1 || m.postal_code) && (
                        <div className="text-[11px] text-slate-500">
                          {m.address_line1}
                          {m.postal_code && ` • ${m.postal_code}`}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-slate-700">
                      <div className="text-[11px] text-slate-500">
                        slug
                      </div>
                      <div className="text-[11px] text-slate-900">
                        {m.slug}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {m.timezone}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {m.is_active ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(m)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={updatingActiveId === m.id}
                          onClick={() => void handleToggleActive(m)}
                          className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 disabled:opacity-60"
                        >
                          {m.is_active ? "Hide in app" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Slide-over / panel for form */}
        {formMode && (
          <div className="absolute inset-0 flex justify-end bg-slate-950/30 backdrop-blur-sm">
            <div className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {formMode === "create"
                      ? "Add masjid"
                      : "Edit masjid"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Basic profile used in the app and Ramadan tools.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <form
                onSubmit={handleSave}
                className="space-y-3 overflow-y-auto pr-1"
              >
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                    Official name *
                  </label>
                  <input
                    type="text"
                    value={form.official_name}
                    onChange={(e) =>
                      handleChange("official_name", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Centro Islamico di Bolzano"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                    Short name
                  </label>
                  <input
                    type="text"
                    value={form.short_name}
                    onChange={(e) =>
                      handleChange("short_name", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Bolzano mosque"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">
                      City *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        handleChange("city", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      placeholder="Bolzano"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">
                      Region / province
                    </label>
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) =>
                        handleChange("region", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      placeholder="Alto Adige"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                    Address line 1
                  </label>
                  <input
                    type="text"
                    value={form.address_line1}
                    onChange={(e) =>
                      handleChange("address_line1", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Via Example 12"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                    Address line 2
                  </label>
                  <input
                    type="text"
                    value={form.address_line2}
                    onChange={(e) =>
                      handleChange("address_line2", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="(optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">
                      Postal code
                    </label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) =>
                        handleChange("postal_code", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      placeholder="39100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">
                      Timezone *
                    </label>
                    <input
                      type="text"
                      value={form.timezone}
                      onChange={(e) =>
                        handleChange("timezone", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      placeholder="Europe/Rome"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      handleChange("slug", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="bolzano-masjid"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Used in URLs and internal references. No spaces, lowercase.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        handleChange("is_active", e.target.checked)
                      }
                      className="h-3 w-3 rounded border-slate-300 text-emerald-700"
                    />
                    Visible in mobile app
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : formMode === "create"
                      ? "Create masjid"
                      : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasjidsAdminPage;
