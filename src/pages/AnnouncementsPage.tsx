// src/pages/AnnouncementsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Spinner,
} from "../components/ui";
import { MegaphoneIcon } from "../components/icons";

const CATEGORY_TONE: Record<
  AnnouncementCategory,
  "slate" | "sky" | "violet" | "amber" | "rose"
> = {
  general: "slate",
  jumuah: "sky",
  event: "violet",
  ramadan: "amber",
  urgent: "rose",
};

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

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15";
  const fieldLabel = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-5">
      {/* Top header row */}
      <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          Publish official updates for each masjid: Jumu‘ah notes, events,
          Ramadan information and urgent alerts. The mobile app reads this as
          the single source of truth.
        </p>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-[520px]">
          <div className="space-y-1.5">
            <label className={fieldLabel}>Masjid</label>
            <Select
              value={selectedMasjidId ?? ""}
              onChange={(e) => setSelectedMasjidId(e.target.value || null)}
              disabled={loadingMasjids}
            >
              {masjids.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.official_name} ({m.city})
                </option>
              ))}
            </Select>
          </div>

          <Button
            className="self-end"
            onClick={resetFormForCreate}
            disabled={!selectedMasjidId}
          >
            + New
          </Button>
        </div>
      </Card>

      {/* Message banner */}
      {message && (
        <Alert tone={messageType === "success" ? "success" : "error"}>
          {message}
        </Alert>
      )}

      {/* Main content layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: list / filters */}
        <Card className="space-y-4 p-5 lg:col-span-2">
          <div className="flex flex-col gap-3 text-xs md:flex-row md:items-end md:justify-between">
            <div className="text-slate-500">
              {selectedMasjid ? (
                <>
                  Managing announcements for{" "}
                  <span className="font-medium text-slate-900">
                    {selectedMasjid.official_name}
                  </span>{" "}
                  ({selectedMasjid.city}). {activeCount} active.
                </>
              ) : (
                "Select a masjid to see announcements."
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {/* Status filter */}
              <div className="space-y-1.5">
                <span className={fieldLabel}>Status</span>
                <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {(["active", "upcoming", "past", "all"] as StatusFilter[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 text-[11px] font-medium transition ${
                          statusFilter === key
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
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
              <div className="space-y-1.5">
                <span className={fieldLabel}>Category</span>
                <Select
                  className="py-1.5 text-xs"
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
                </Select>
              </div>
            </div>
          </div>

          {/* List */}
          {loadingRows ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner /> Loading announcements…
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={<MegaphoneIcon />}
              title="No announcements match"
              description="Create one on the right, or change the filters above."
            />
          ) : (
            <div className="space-y-2">
              {filteredRows.map((r) => {
                const status = r.status;
                const isUpcoming = status === "upcoming";
                const isActive = status === "active";
                const selected = form?.id === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => startEdit(r)}
                    className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {r.is_pinned && <Badge tone="amber">📌 Pinned</Badge>}
                        <Badge tone={CATEGORY_TONE[r.category]}>
                          {r.category.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge
                        tone={isActive ? "emerald" : isUpcoming ? "sky" : "slate"}
                      >
                        {isActive ? "Active" : isUpcoming ? "Upcoming" : "Past"}
                      </Badge>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-slate-900">
                          {r.title}
                        </div>
                        <div className="line-clamp-1 text-xs text-slate-500">
                          {r.body}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] text-slate-400">
                        {(r.starts_at ?? r.created_at).slice(0, 10)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: editor panel */}
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {form
                ? isEditing
                  ? "Edit announcement"
                  : "New announcement"
                : "Announcement editor"}
            </div>
            <div className="text-xs text-slate-500">
              {form
                ? "Adjust fields and save. Changes are live for the mobile app."
                : "Select an announcement from the list or create a new one."}
            </div>
          </div>

          {!form ? (
            <div className="mt-1 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-4 text-xs text-slate-500">
              No announcement selected. Click{" "}
              <span className="font-medium text-emerald-700">“New”</span> above or
              pick one from the list to edit.
            </div>
          ) : (
            <form
              className="mt-1 space-y-4"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              {/* Title */}
              <div className="space-y-1.5">
                <label className={fieldLabel}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={inputCls}
                  placeholder="Short headline (e.g. Jumu‘ah reminder)"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className={fieldLabel}>Body text</label>
                <textarea
                  value={form.body}
                  onChange={(e) => handleChange("body", e.target.value)}
                  rows={6}
                  className={`${inputCls} resize-y`}
                  placeholder="Full announcement text as it should appear in the app…"
                />
                <p className="text-[11px] text-slate-400">
                  Paste links with https:// or www. and they will be clickable on
                  the public masjid page.
                </p>
              </div>

              {/* Category + pinned */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className={fieldLabel}>Category</label>
                  <Select
                    value={form.category}
                    onChange={(e) =>
                      handleChange(
                        "category",
                        e.target.value as AnnouncementCategory
                      )
                    }
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className={fieldLabel}>Pin to top</label>
                  <button
                    type="button"
                    onClick={() => handleChange("is_pinned", !form.is_pinned)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition ${
                      form.is_pinned
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        form.is_pinned ? "bg-amber-400" : "bg-slate-400"
                      }`}
                    />
                    {form.is_pinned ? "Pinned" : "Not pinned"}
                  </button>
                </div>
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Visible from (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => handleChange("starts_at", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-400">
                    Leave empty to publish immediately.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Visible until (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => handleChange("ends_at", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-400">
                    Leave empty to keep it visible until manually edited.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                <div className="text-[11px] text-slate-400">
                  {form.id
                    ? `Editing existing announcement (ID ${form.id}).`
                    : "Creating a new announcement for this masjid."}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {form.id && (
                    <Button
                      variant="danger"
                      onClick={() => void handleDelete()}
                      disabled={deleting || saving}
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setForm(null);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : form.id
                      ? "Save changes"
                      : "Create announcement"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
