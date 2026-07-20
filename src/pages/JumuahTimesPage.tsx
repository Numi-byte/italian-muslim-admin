// src/pages/JumuahTimesPage.tsx
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
import { CalendarIcon } from "../components/icons";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type JumuahRow = {
  id: number;
  masjid_id: string;
  slot: number;
  khutbah_time: string;   // "HH:MM:SS"
  jamaat_time: string;    // "HH:MM:SS"
  language: string | null;
  notes: string | null;
  valid_from: string | null; // date
  valid_to: string | null;   // date
  created_at: string;
  updated_at: string;
};

type JumuahStatus = "active" | "future" | "expired";

type FormState = {
  id: number | null;
  slot: string;          // "1", "2", ...
  khutbah_time: string;  // "HH:MM"
  jamaat_time: string;   // "HH:MM"
  language: string;
  notes: string;
  valid_from: string;    // "YYYY-MM-DD"
  valid_to: string;      // "YYYY-MM-DD"
};

const getStatus = (row: JumuahRow, today: Date): JumuahStatus => {
  const start = row.valid_from ? new Date(row.valid_from) : null;
  const end = row.valid_to ? new Date(row.valid_to) : null;

  if (end && end < today) return "expired";
  if (start && start > today) return "future";
  return "active";
};

const timeToDisplay = (t: string | null): string => {
  if (!t) return "—";
  return t.slice(0, 5); // "HH:MM:SS" -> "HH:MM"
};

const JumuahTimesPage: React.FC = () => {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);

  const [rows, setRows] = useState<JumuahRow[]>([]);
  const [loadingMasjids, setLoadingMasjids] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const today = useMemo(() => new Date(), []);

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === selectedMasjidId) ?? null,
    [masjids, selectedMasjidId]
  );

  // -------------------------------------------------------------------
  // Load masjids
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // Load Jumu'ah rows
  // -------------------------------------------------------------------
  const loadJumuahRows = async (masjidId: string) => {
    setLoadingRows(true);
    setMessage(null);
    setMessageType(null);

    const { data, error } = await supabase
      .from("masjid_jumuah_times")
      .select(
        "id, masjid_id, slot, khutbah_time, jamaat_time, language, notes, valid_from, valid_to, created_at, updated_at"
      )
      .eq("masjid_id", masjidId)
      .order("slot", { ascending: true });

    if (error) {
      console.error("Error loading masjid_jumuah_times", error);
      setRows([]);
      setMessage(error.message);
      setMessageType("error");
    } else {
      setRows((data ?? []) as JumuahRow[]);
    }

    setLoadingRows(false);
  };

  useEffect(() => {
    if (!selectedMasjidId) {
      setRows([]);
      return;
    }
    void loadJumuahRows(selectedMasjidId);
    setForm(null);
  }, [selectedMasjidId]);

  // -------------------------------------------------------------------
  // Form helpers
  // -------------------------------------------------------------------
  const resetFormForCreate = () => {
    setForm({
      id: null,
      slot: "",
      khutbah_time: "",
      jamaat_time: "",
      language: "",
      notes: "",
      valid_from: "",
      valid_to: "",
    });
    setMessage(null);
    setMessageType(null);
  };

  const startEdit = (row: JumuahRow) => {
    setForm({
      id: row.id,
      slot: String(row.slot),
      khutbah_time: timeToDisplay(row.khutbah_time),
      jamaat_time: timeToDisplay(row.jamaat_time),
      language: row.language ?? "",
      notes: row.notes ?? "",
      valid_from: row.valid_from ?? "",
      valid_to: row.valid_to ?? "",
    });
    setMessage(null);
    setMessageType(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  // -------------------------------------------------------------------
  // Save / delete
  // -------------------------------------------------------------------
  const handleSave = async () => {
    if (!form || !selectedMasjidId) return;

    // basic validation
    const slotNum = Number(form.slot);
    if (!Number.isInteger(slotNum) || slotNum <= 0 || slotNum > 5) {
      setMessage("Slot must be a number between 1 and 5.");
      setMessageType("error");
      return;
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(form.khutbah_time)) {
      setMessage("Please enter a valid khutbah time (HH:MM).");
      setMessageType("error");
      return;
    }
    if (!timeRegex.test(form.jamaat_time)) {
      setMessage("Please enter a valid jamāʿah time (HH:MM).");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage(null);
    setMessageType(null);

    try {
      const payload = {
        masjid_id: selectedMasjidId,
        slot: slotNum,
        khutbah_time: `${form.khutbah_time}:00`,
        jamaat_time: `${form.jamaat_time}:00`,
        language: form.language.trim() || null,
        notes: form.notes.trim() || null,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
      };

      let errorMessage: string | null = null;

      if (form.id) {
        const { error } = await supabase
          .from("masjid_jumuah_times")
          .update(payload)
          .eq("id", form.id);

        if (error) {
          console.error("Error updating Jumu'ah row", error);
          errorMessage = error.message;
        }
      } else {
        const { error } = await supabase
          .from("masjid_jumuah_times")
          .insert(payload);

        if (error) {
          console.error("Error inserting Jumu'ah row", error);
          errorMessage = error.message;
        }
      }

      if (errorMessage) {
        setMessage(errorMessage);
        setMessageType("error");
      } else {
        await loadJumuahRows(selectedMasjidId);
        setMessage(form.id ? "Jumuʿah slot updated." : "Jumuʿah slot created.");
        setMessageType("success");
        setForm(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form || !form.id || !selectedMasjidId) return;


    const ok = window.confirm(
      "Delete this Jumuʿah slot permanently for this masjid?"
    );
    if (!ok) return;

    setDeleting(true);
    setMessage(null);
    setMessageType(null);

    try {
      const { error } = await supabase
        .from("masjid_jumuah_times")
        .delete()
        .eq("id", form.id);

      if (error) {
        console.error("Error deleting Jumu'ah row", error);
        setMessage(error.message);
        setMessageType("error");
      } else {
        await loadJumuahRows(selectedMasjidId);
        setMessage("Jumuʿah slot deleted.");
        setMessageType("success");
        setForm(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15";
  const fieldLabel = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-5">
      {/* Header row */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Define one or more Jumuʿah slots per masjid. Each slot has khutbah &
            jamāʿah time, optional language and notes, and an active date range.
            The mobile app shows only currently valid slots.
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
              + Add slot
            </Button>
          </div>
        </div>
      </Card>

      {/* Message banner */}
      {message && (
        <Alert tone={messageType === "success" ? "success" : "error"}>
          {message}
        </Alert>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: list */}
        <Card className="space-y-4 p-5 lg:col-span-2">
          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {selectedMasjid ? (
                <>
                  Managing Jumuʿah for{" "}
                  <span className="font-medium text-slate-900">
                    {selectedMasjid.official_name}
                  </span>{" "}
                  ({selectedMasjid.city}).
                </>
              ) : (
                "Select a masjid to manage Jumuʿah slots."
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Today:{" "}
              {today.toLocaleDateString("it-IT", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })}
            </div>
          </div>

          {loadingRows ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner /> Loading Jumuʿah slots…
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="No Jumuʿah slots yet"
              description="Click “Add slot” to create the first Jumuʿah entry for this masjid."
            />
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const status = getStatus(r, today);
                const isActive = status === "active";
                const isFuture = status === "future";
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
                      <div className="flex items-center gap-2">
                        <Badge tone="slate">Slot {r.slot}</Badge>
                        {r.language && <Badge tone="violet">{r.language}</Badge>}
                      </div>

                      <Badge
                        tone={isActive ? "emerald" : isFuture ? "sky" : "slate"}
                      >
                        {isActive
                          ? "Active"
                          : isFuture
                          ? "Scheduled"
                          : "Expired"}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-4">
                          <div>
                            <span className="mr-1 text-slate-500">Khutbah:</span>
                            <span className="font-semibold text-slate-900">
                              {timeToDisplay(r.khutbah_time)}
                            </span>
                          </div>
                          <div>
                            <span className="mr-1 text-slate-500">Jamāʿah:</span>
                            <span className="font-semibold text-slate-900">
                              {timeToDisplay(r.jamaat_time)}
                            </span>
                          </div>
                        </div>
                        {r.notes && (
                          <div className="line-clamp-1 text-slate-500">
                            {r.notes}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-right text-[11px] text-slate-400">
                        {r.valid_from || r.valid_to ? (
                          <>
                            {r.valid_from ?? "…"} → {r.valid_to ?? "…"}
                          </>
                        ) : (
                          "Always valid"
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: editor */}
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {form
                ? form.id
                  ? "Edit Jumuʿah slot"
                  : "New Jumuʿah slot"
                : "Jumuʿah editor"}
            </div>
            <div className="text-xs text-slate-500">
              {form
                ? "Adjust slot details and save. Changes apply immediately in the mobile app."
                : "Select a slot from the list or click “Add slot” to create one."}
            </div>
          </div>

          {!form ? (
            <div className="mt-1 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-4 text-xs text-slate-500">
              No slot selected. Click{" "}
              <span className="font-medium text-emerald-700">“Add slot”</span> or
              choose one from the list to edit.
            </div>
          ) : (
            <form
              className="mt-1 space-y-4"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              {/* Slot number */}
              <div className="space-y-1.5">
                <label className={fieldLabel}>Slot number</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.slot}
                  onChange={(e) => handleChange("slot", e.target.value)}
                  className={inputCls}
                  placeholder="1, 2, 3…"
                />
                <p className="text-[11px] text-slate-400">
                  Use 1 for first Jumuʿah, 2 for second, etc.
                </p>
              </div>

              {/* Times */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Khutbah time</label>
                  <input
                    type="time"
                    value={form.khutbah_time}
                    onChange={(e) => handleChange("khutbah_time", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Jamāʿah time</label>
                  <input
                    type="time"
                    value={form.jamaat_time}
                    onChange={(e) => handleChange("jamaat_time", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Language & notes */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Language (optional)</label>
                  <input
                    type="text"
                    value={form.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className={inputCls}
                    placeholder="Italian, Arabic, Urdu…"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Notes (optional)</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className={inputCls}
                    placeholder="Capacity, brothers only, youth group…"
                  />
                </div>
              </div>

              {/* Validity range */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Valid from (optional)</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => handleChange("valid_from", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-400">
                    Leave empty to make it valid immediately.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Valid until (optional)</label>
                  <input
                    type="date"
                    value={form.valid_to}
                    onChange={(e) => handleChange("valid_to", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-400">
                    Leave empty if the slot should stay until you change it.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                <div className="text-[11px] text-slate-400">
                  {form.id
                    ? `Editing existing Jumuʿah slot (ID ${form.id}).`
                    : "Creating a new Jumuʿah slot for this masjid."}
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
                  <Button variant="secondary" onClick={() => setForm(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : form.id
                      ? "Save changes"
                      : "Create slot"}
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

export default JumuahTimesPage;
