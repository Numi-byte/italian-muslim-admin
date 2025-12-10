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
        <h2 className="text-base font-semibold text-slate-100">
          Masjid directory
        </h2>
        <p className="text-xs text-slate-400">
          Onboard new masjids, update details and control which ones are
          visible in the app.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 text-xs text-red-200 px-3 py-2">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 text-xs text-emerald-200 px-3 py-2">
          {successMsg}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs relative">
        {/* Header bar */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-200 font-medium">Masjids</span>
            {loading && (
              <span className="text-[11px] text-slate-400">Loading…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateForm}
              className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
            >
              + Add masjid
            </button>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="text-[11px] px-2 py-1 rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-4 text-slate-400">
            No masjids yet. Use{" "}
            <span className="font-semibold text-slate-200">
              &ldquo;Add masjid&rdquo;
            </span>{" "}
            to onboard your first one.
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-900/80 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Location
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Slug / TZ
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-slate-800">
                    <td className="px-3 py-2 align-middle text-slate-100">
                      <div className="font-semibold">
                        {m.official_name}
                      </div>
                      {m.short_name && (
                        <div className="text-[11px] text-slate-400">
                          {m.short_name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-slate-200">
                      <div>{m.city}</div>
                      <div className="text-[11px] text-slate-400">
                        {m.region ?? ""}
                      </div>
                      {(m.address_line1 || m.postal_code) && (
                        <div className="text-[11px] text-slate-500">
                          {m.address_line1}
                          {m.postal_code && ` • ${m.postal_code}`}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-slate-200">
                      <div className="text-[11px] text-slate-400">
                        slug
                      </div>
                      <div className="text-[11px] text-slate-100">
                        {m.slug}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {m.timezone}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {m.is_active ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-500 text-emerald-950 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-700 text-slate-50 font-medium">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(m)}
                          className="px-2 py-1 rounded-full text-[11px] border border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={updatingActiveId === m.id}
                          onClick={() => void handleToggleActive(m)}
                          className="px-2 py-1 rounded-full text-[11px] border border-amber-500/70 bg-amber-500/10 text-amber-100 disabled:opacity-60"
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
          <div className="absolute inset-0 bg-black/40 flex justify-end backdrop-blur-sm">
            <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {formMode === "create"
                      ? "Add masjid"
                      : "Edit masjid"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Basic profile used in the app and Ramadan tools.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-[11px] px-2 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              <form
                onSubmit={handleSave}
                className="space-y-3 overflow-y-auto pr-1"
              >
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Official name *
                  </label>
                  <input
                    type="text"
                    value={form.official_name}
                    onChange={(e) =>
                      handleChange("official_name", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Centro Islamico di Bolzano"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Short name
                  </label>
                  <input
                    type="text"
                    value={form.short_name}
                    onChange={(e) =>
                      handleChange("short_name", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Bolzano mosque"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        handleChange("city", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Bolzano"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Region / province
                    </label>
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) =>
                        handleChange("region", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Alto Adige"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Address line 1
                  </label>
                  <input
                    type="text"
                    value={form.address_line1}
                    onChange={(e) =>
                      handleChange("address_line1", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Via Example 12"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Address line 2
                  </label>
                  <input
                    type="text"
                    value={form.address_line2}
                    onChange={(e) =>
                      handleChange("address_line2", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="(optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Postal code
                    </label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) =>
                        handleChange("postal_code", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="39100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Timezone *
                    </label>
                    <input
                      type="text"
                      value={form.timezone}
                      onChange={(e) =>
                        handleChange("timezone", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Europe/Rome"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      handleChange("slug", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="bolzano-masjid"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Used in URLs and internal references. No spaces, lowercase.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-[11px] text-slate-200">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        handleChange("is_active", e.target.checked)
                      }
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-emerald-500"
                    />
                    Visible in mobile app
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-[11px] text-slate-200 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 rounded-full border border-emerald-500 bg-emerald-500 text-[11px] text-emerald-950 font-semibold disabled:opacity-60"
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
