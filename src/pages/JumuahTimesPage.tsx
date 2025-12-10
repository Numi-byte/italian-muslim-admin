// src/pages/JumuahTimesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Jumuʿah schedule
          </h2>
          <p className="text-xs text-slate-400">
            Define one or more Jumuʿah slots per masjid. Each slot has khutbah &
            jamāʿah time, optional language and notes, and an active date
            range. The mobile app will show only currently valid slots.
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
            + Add Jumuʿah slot
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

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: list */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <div>
              {selectedMasjid ? (
                <>
                  Managing Jumuʿah for{" "}
                  <span className="text-slate-100 font-medium">
                    {selectedMasjid.official_name}
                  </span>{" "}
                  ({selectedMasjid.city}).
                </>
              ) : (
                "Select a masjid to manage Jumuʿah slots."
              )}
            </div>
            <div className="text-[11px] text-slate-500">
              Today:{" "}
              {today.toLocaleDateString("it-IT", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })}
            </div>
          </div>

          {loadingRows ? (
            <div className="text-xs text-slate-400">
              Loading Jumuʿah slots…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-xs text-slate-400 border border-dashed border-slate-700 rounded-lg px-3 py-4">
              No Jumuʿah slots configured yet for this masjid. Click{" "}
              <span className="text-emerald-300 font-medium">
                “Add Jumuʿah slot”
              </span>{" "}
              to create the first one.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {rows.map((r) => {
                const status = getStatus(r, today);
                const isActive = status === "active";
                const isFuture = status === "future";

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => startEdit(r)}
                    className="w-full text-left rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-900/80 px-3 py-2.5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                          Slot {r.slot}
                        </span>
                        {r.language && (
                          <span className="inline-flex items-center rounded-full bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                            {r.language}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                          isActive
                            ? "border-emerald-400/70 text-emerald-200"
                            : isFuture
                            ? "border-sky-400/70 text-sky-200"
                            : "border-slate-500/70 text-slate-300"
                        }`}
                      >
                        {isActive
                          ? "Active"
                          : isFuture
                          ? "Scheduled"
                          : "Expired"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-slate-500 mr-1">
                              Khutbah:
                            </span>
                            <span className="text-slate-100 font-medium">
                              {timeToDisplay(r.khutbah_time)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 mr-1">
                              Jamāʿah:
                            </span>
                            <span className="text-slate-100 font-medium">
                              {timeToDisplay(r.jamaat_time)}
                            </span>
                          </div>
                        </div>
                        {r.notes && (
                          <div className="text-slate-400 line-clamp-1">
                            {r.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 text-right shrink-0">
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
        </div>

        {/* Right: editor */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                {form ? (form.id ? "Edit Jumuʿah slot" : "New Jumuʿah slot") : "Jumuʿah editor"}
              </div>
              <div className="text-[11px] text-slate-500">
                {form
                  ? "Adjust slot details and save. Changes apply immediately in the mobile app."
                  : "Select a slot from the list or click “Add Jumuʿah slot” to create one."}
              </div>
            </div>
          </div>

          {!form ? (
            <div className="mt-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/80 px-3 py-3 text-[11px] text-slate-400">
              No slot selected. Click{" "}
              <span className="text-emerald-300 font-medium">
                “Add Jumuʿah slot”
              </span>{" "}
              or choose one from the list to edit.
            </div>
          ) : (
            <form
              className="mt-1 space-y-3 text-xs"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              {/* Slot number */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Slot number
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.slot}
                  onChange={(e) => handleChange("slot", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  placeholder="1, 2, 3…"
                />
                <p className="text-[10px] text-slate-500">
                  Use 1 for first Jumuʿah, 2 for second, etc.
                </p>
              </div>

              {/* Times */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Khutbah time
                  </label>
                  <input
                    type="time"
                    value={form.khutbah_time}
                    onChange={(e) =>
                      handleChange("khutbah_time", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Jamāʿah time
                  </label>
                  <input
                    type="time"
                    value={form.jamaat_time}
                    onChange={(e) =>
                      handleChange("jamaat_time", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Language & notes */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Language (optional)
                  </label>
                  <input
                    type="text"
                    value={form.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                    placeholder="Italian, Arabic, Urdu…"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                    placeholder="Capacity, brothers only, youth group…"
                  />
                </div>
              </div>

              {/* Validity range */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Valid from (optional)
                  </label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) =>
                      handleChange("valid_from", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Leave empty to make it valid immediately.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Valid until (optional)
                  </label>
                  <input
                    type="date"
                    value={form.valid_to}
                    onChange={(e) => handleChange("valid_to", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Leave empty if the slot should stay until you change it.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-2 justify-between items-center">
                <div className="text-[11px] text-slate-500">
                  {form.id ? (
                    <>Editing existing Jumuʿah slot (ID {form.id}).</>
                  ) : (
                    <>Creating a new Jumuʿah slot for this masjid.</>
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
                    onClick={() => setForm(null)}
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
                      : "Create slot"}
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

export default JumuahTimesPage;
