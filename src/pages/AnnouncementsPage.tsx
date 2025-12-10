// src/pages/AnnouncementsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type AnnouncementCategory =
  | "general"
  | "jumuah"
  | "event"
  | "ramadan"
  | "urgent";

type AnnouncementRow = {
  id: number;
  masjid_id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  starts_at: string | null;
  ends_at: string | null;
  is_pinned: boolean;
  created_at: string;
};

type AnnouncementStatus = "active" | "upcoming" | "past";
type StatusFilter = "active" | "upcoming" | "past" | "all";
type CategoryFilter = "all" | AnnouncementCategory;

type FormState = {
  id: number | null;
  title: string;
  body: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  starts_at: string; // "YYYY-MM-DDTHH:MM"
  ends_at: string;   // "YYYY-MM-DDTHH:MM"
};

type AnnouncementPayload = {
  masjid_id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const CATEGORY_OPTIONS: { value: AnnouncementCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "jumuah", label: "Jumu‘ah" },
  { value: "event", label: "Event" },
  { value: "ramadan", label: "Ramadan" },
  { value: "urgent", label: "Urgent" },
];

const getStatus = (row: AnnouncementRow, now: Date): AnnouncementStatus => {
  const start = row.starts_at ? new Date(row.starts_at) : null;
  const end = row.ends_at ? new Date(row.ends_at) : null;

  if (end && end < now) return "past";
  if (start && start > now) return "upcoming";
  return "active";
};

const toLocalInputValue = (iso: string | null): string => {
  if (!iso) return "";
  // "2025-11-27T10:30:00.000Z" -> "2025-11-27T10:30"
  return iso.slice(0, 16);
};

const AnnouncementsPage: React.FC = () => {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);

  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");

  const [loadingMasjids, setLoadingMasjids] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<FormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const now = useMemo(() => new Date(), []);

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === selectedMasjidId) ?? null,
    [masjids, selectedMasjidId]
  );

  // ------------------------------------------------------------
  // Load masjids
  // ------------------------------------------------------------
  useEffect(() => {
    const loadMasjids = async () => {
      setLoadingMasjids(true);

      const { data, error } = await supabase
        .from("public_masjids")
        .select("id, official_name, city")
        .order("city", { ascending: true });

      if (error) {
        console.error("Error loading masjids", error);
        setMasjids([]);
        setMessage(error.message);
        setMessageType("error");
      } else if (data) {
        const list = data as Masjid[];
        setMasjids(list);
        if (list.length > 0) {
          setSelectedMasjidId((prev) => prev ?? list[0].id);
        }
      }

      setLoadingMasjids(false);
    };

    void loadMasjids();
  }, []);

  // ------------------------------------------------------------
  // Load announcements for selected masjid
  // ------------------------------------------------------------
  const loadAnnouncements = async (masjidId: string) => {
    setLoadingRows(true);
    setMessage(null);
    setMessageType(null);

    const { data, error } = await supabase
      .from("masjid_announcements")
      .select(
        "id, masjid_id, title, body, category, starts_at, ends_at, is_pinned, created_at"
      )
      .eq("masjid_id", masjidId)
      .order("is_pinned", { ascending: false })
      .order("starts_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading masjid_announcements", error);
      setRows([]);
      setMessage(error.message);
      setMessageType("error");
    } else {
      setRows((data ?? []) as AnnouncementRow[]);
    }

    setLoadingRows(false);
  };

  useEffect(() => {
    if (!selectedMasjidId) {
      setRows([]);
      return;
    }
    void loadAnnouncements(selectedMasjidId);
    setForm(null);
    setIsEditing(false);
  }, [selectedMasjidId]);

  // ------------------------------------------------------------
  // Derived list with filters
  // ------------------------------------------------------------
  const filteredRows = useMemo(() => {
    const annotated: (AnnouncementRow & { status: AnnouncementStatus })[] =
      rows.map((r) => ({
        ...r,
        status: getStatus(r, now),
      }));

    let list = annotated;

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((r) => r.category === categoryFilter);
    }

    // pinned first again
    return [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      const aKey = a.starts_at ?? a.created_at;
      const bKey = b.starts_at ?? b.created_at;
      return bKey.localeCompare(aKey);
    });
  }, [rows, now, statusFilter, categoryFilter]);

  const activeCount = useMemo(
    () =>
      rows.filter((r) => getStatus(r, now) === "active").length,
    [rows, now]
  );

  // ------------------------------------------------------------
  // Form helpers
  // ------------------------------------------------------------
  const resetFormForCreate = () => {
    setForm({
      id: null,
      title: "",
      body: "",
      category: "general",
      is_pinned: false,
      starts_at: "",
      ends_at: "",
    });
    setIsEditing(false);
    setMessage(null);
    setMessageType(null);
  };

  const startEdit = (row: AnnouncementRow) => {
    setForm({
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      is_pinned: row.is_pinned,
      starts_at: toLocalInputValue(row.starts_at),
      ends_at: toLocalInputValue(row.ends_at),
    });
    setIsEditing(true);
    setMessage(null);
    setMessageType(null);
  };

  const handleChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    if (!form) return;
    setForm({ ...form, [field]: value } as FormState);
  };

  // ------------------------------------------------------------
  // Save / delete
  // ------------------------------------------------------------
  const handleSave = async () => {
    if (!form || !selectedMasjidId) return;

    if (!form.title.trim()) {
      setMessage("Title is required.");
      setMessageType("error");
      return;
    }
    if (!form.body.trim()) {
      setMessage("Body text is required.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage(null);
    setMessageType(null);

    try {
      const payload: AnnouncementPayload = {
        masjid_id: selectedMasjidId,
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        is_pinned: form.is_pinned,
        starts_at: form.starts_at
          ? new Date(form.starts_at).toISOString()
          : null,
        ends_at: form.ends_at
          ? new Date(form.ends_at).toISOString()
          : null,
      };

      if (form.id) {
        const { error } = await supabase
          .from("masjid_announcements")
          .update(payload)
          .eq("id", form.id);

        if (error) {
          console.error("Error saving announcement", error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          await loadAnnouncements(selectedMasjidId);
          setMessage("Announcement updated.");
          setMessageType("success");
          setForm(null);
          setIsEditing(false);
        }
      } else {
        const { error } = await supabase
          .from("masjid_announcements")
          .insert(payload);

        if (error) {
          console.error("Error saving announcement", error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          await loadAnnouncements(selectedMasjidId);
          setMessage("Announcement created.");
          setMessageType("success");
          setForm(null);
          setIsEditing(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form || !form.id) return;
    if (!selectedMasjidId) return;

    // you can replace this with your own confirm modal later
    const ok = window.confirm("Delete this announcement permanently?");
    if (!ok) return;

    setDeleting(true);
    setMessage(null);
    setMessageType(null);

    try {
      const { error } = await supabase
        .from("masjid_announcements")
        .delete()
        .eq("id", form.id);

      if (error) {
        console.error("Error deleting announcement", error);
        setMessage(error.message);
        setMessageType("error");
      } else {
        await loadAnnouncements(selectedMasjidId);
        setMessage("Announcement deleted.");
        setMessageType("success");
        setForm(null);
        setIsEditing(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Top header row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Masjid announcements
          </h2>
          <p className="text-xs text-slate-400">
            Publish official updates for each masjid: Jumu‘ah notes, events,
            Ramadan information and urgent alerts. The mobile app reads this as
            the single source of truth.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Masjid:</span>
            <select
              className="text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
              value={selectedMasjidId ?? ""}
              onChange={(e) => setSelectedMasjidId(e.target.value || null)}
              disabled={loadingMasjids}
            >
              {masjids.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.official_name} ({m.city})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetFormForCreate}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-semibold px-3 py-1.5 disabled:opacity-60"
            disabled={!selectedMasjidId}
          >
            + New announcement
          </button>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            messageType === "success"
              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/70 bg-red-500/10 text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Main content layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: list / filters */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs">
            <div className="text-slate-400">
              {selectedMasjid ? (
                <>
                  Managing announcements for{" "}
                  <span className="text-slate-100 font-medium">
                    {selectedMasjid.official_name}
                  </span>{" "}
                  ({selectedMasjid.city}).{" "}
                  <span className="text-slate-500">
                    {activeCount} active.
                  </span>
                </>
              ) : (
                "Select a masjid to see announcements."
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Status</span>
                <div className="inline-flex rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
                  {(["active", "upcoming", "past", "all"] as StatusFilter[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 text-[11px] ${
                          statusFilter === key
                            ? "bg-emerald-500 text-emerald-950 font-semibold"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {key === "active"
                          ? "Active"
                          : key === "upcoming"
                          ? "Upcoming"
                          : key === "past"
                          ? "Past"
                          : "All"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Category</span>
                <select
                  className="bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 text-[11px] text-slate-100"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as CategoryFilter)
                  }
                >
                  <option value="all">All</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          {loadingRows ? (
            <div className="text-xs text-slate-400">Loading announcements…</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-xs text-slate-400 border border-dashed border-slate-700 rounded-lg px-3 py-4">
              No announcements match the current filters. Create one on the
              right or change filters.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {filteredRows.map((r) => {
                const status = r.status;
                const isUpcoming = status === "upcoming";
                const isActive = status === "active";

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => startEdit(r)}
                    className="w-full text-left rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-900/80 px-3 py-2.5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {r.is_pinned && (
                          <span className="inline-flex items-center rounded-full bg-amber-400/10 border border-amber-400/60 text-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                            PINNED
                          </span>
                        )}

                        <span className="inline-flex items-center rounded-full bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                          {r.category.toUpperCase()}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                          isActive
                            ? "border-emerald-400/70 text-emerald-200"
                            : isUpcoming
                            ? "border-sky-400/70 text-sky-200"
                            : "border-slate-500/70 text-slate-300"
                        }`}
                      >
                        {isActive
                          ? "Active"
                          : isUpcoming
                          ? "Upcoming"
                          : "Past"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-slate-100 font-medium truncate">
                          {r.title}
                        </div>
                        <div className="text-slate-400 line-clamp-1">
                          {r.body}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 shrink-0">
                        {(r.starts_at ?? r.created_at).slice(0, 10)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: editor panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                {form
                  ? isEditing
                    ? "Edit announcement"
                    : "New announcement"
                  : "Announcement editor"}
              </div>
              <div className="text-[11px] text-slate-500">
                {form
                  ? "Adjust fields and save. Changes are live for the mobile app."
                  : "Select an announcement from the list or create a new one."}
              </div>
            </div>
          </div>

          {!form ? (
            <div className="mt-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/80 px-3 py-3 text-[11px] text-slate-400">
              No announcement selected. Click{" "}
              <span className="text-emerald-300 font-medium">
                “New announcement”
              </span>{" "}
              above or pick one from the list to edit.
            </div>
          ) : (
            <form
              className="mt-1 space-y-3 text-xs"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  placeholder="Short headline (e.g. Jumu‘ah reminder)"
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Body text
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => handleChange("body", e.target.value)}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs resize-none"
                  placeholder="Full announcement text as it should appear in the app…"
                />
              </div>

              {/* Category + pinned */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      handleChange(
                        "category",
                        e.target.value as AnnouncementCategory
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Pin to top
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange("is_pinned", !form.is_pinned)
                    }
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${
                      form.is_pinned
                        ? "border-amber-400 bg-amber-400/10 text-amber-100"
                        : "border-slate-600 bg-slate-900 text-slate-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        form.is_pinned ? "bg-amber-400" : "bg-slate-500"
                      }`}
                    />
                    {form.is_pinned ? "Pinned for this masjid" : "Not pinned"}
                  </button>
                </div>
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Visible from (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) =>
                      handleChange("starts_at", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Leave empty to publish immediately.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Visible until (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) =>
                      handleChange("ends_at", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Leave empty to keep it visible until manually edited.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-2 justify-between items-center">
                <div className="text-[11px] text-slate-500">
                  {form.id ? (
                    <>Editing existing announcement (ID {form.id}).</>
                  ) : (
                    <>Creating a new announcement for this masjid.</>
                  )}
                </div>

                <div className="flex gap-2">
                  {form.id && (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={deleting || saving}
                      className="px-3 py-1.5 rounded-lg border border-red-500/70 text-[11px] text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setForm(null);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 text-[11px] text-slate-200 hover:bg-slate-800/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-emerald-950 text-[11px] font-semibold disabled:opacity-60"
                  >
                    {saving
                      ? "Saving…"
                      : form.id
                      ? "Save changes"
                      : "Create announcement"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
