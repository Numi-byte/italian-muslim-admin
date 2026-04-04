// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

type PrayerRow = {
  id: number | null; // null = not saved yet
  masjid_id: string;
  date: string; // YYYY-MM-DD
  prayer: PrayerKey;
  start_time: string; // HH:MM
  jamaat_time: string; // HH:MM
};

type PrayerTimeDbRow = {
  id: number;
  masjid_id: string;
  date: string;
  prayer: PrayerKey;
  start_time: string; // "HH:MM:SS"
  jamaat_time: string; // "HH:MM:SS"
};

const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

const getTodayIsoRome = (): string => {
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return iso;
};

const PrayerTimesPage: React.FC = () => {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayIsoRome()
  );

  const [rows, setRows] = useState<PrayerRow[]>([]);
  const [loadingMasjids, setLoadingMasjids] = useState(false);
  const [loadingPrayers, setLoadingPrayers] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === selectedMasjidId) ?? null,
    [masjids, selectedMasjidId]
  );

  // ---------------------------------------------------------------------------
  // Load masjids
  // ---------------------------------------------------------------------------

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
      } else if (data) {
        const masjidRows = data as Masjid[];
        setMasjids(masjidRows);
        if (masjidRows.length > 0) {
          setSelectedMasjidId((prev) => prev ?? masjidRows[0].id);
        }
      }

      setLoadingMasjids(false);
    };

    void loadMasjids();
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const buildEmptyRows = (masjidId: string, date: string): PrayerRow[] =>
    PRAYERS.map((p) => ({
      id: null,
      masjid_id: masjidId,
      date,
      prayer: p.key,
      start_time: "",
      jamaat_time: "",
    }));

  const loadPrayerTimes = async (masjidId: string, date: string) => {
    setLoadingPrayers(true);
    setMessage(null);
    setMessageType(null);
    setDirty(false); // fresh load = no unsaved changes

    const { data, error } = await supabase
      .from("masjid_prayer_times")
      .select("*")
      .eq("masjid_id", masjidId)
      .eq("date", date)
      .order("prayer", { ascending: true });

    if (error) {
      console.error("Error loading masjid_prayer_times", error);
      setRows(buildEmptyRows(masjidId, date));
      setMessage(error.message);
      setMessageType("error");
    } else if (!data || data.length === 0) {
      // no times defined yet → empty template
      setRows(buildEmptyRows(masjidId, date));
    } else {
      const existing = data as PrayerTimeDbRow[];
      const map = new Map<PrayerKey, PrayerRow>();

      for (const row of existing) {
        map.set(row.prayer, {
          id: row.id,
          masjid_id: row.masjid_id,
          date: row.date,
          prayer: row.prayer,
          start_time: row.start_time.slice(0, 5), // HH:MM:SS -> HH:MM
          jamaat_time: row.jamaat_time.slice(0, 5),
        });
      }

      const merged: PrayerRow[] = PRAYERS.map((p) => {
        const found = map.get(p.key);
        if (found) return found;
        return {
          id: null,
          masjid_id: masjidId,
          date,
          prayer: p.key,
          start_time: "",
          jamaat_time: "",
        };
      });

      setRows(merged);
    }

    setLoadingPrayers(false);
  };

  // load when masjid or date changes
  useEffect(() => {
    if (!selectedMasjidId || !selectedDate) {
      setRows([]);
      return;
    }
    void loadPrayerTimes(selectedMasjidId, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMasjidId, selectedDate]);

  const updateRow = (
    prayerKey: PrayerKey,
    patch: Partial<Pick<PrayerRow, "start_time" | "jamaat_time">>
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.prayer === prayerKey ? { ...r, ...patch } : r))
    );
    setMessage(null);
    setMessageType(null);
    setDirty(true);
  };

  const handleCopyFromPreviousDay = async () => {
    if (!selectedMasjidId || !selectedDate) return;

    const current = new Date(selectedDate);
    const prevDate = new Date(current.getTime() - 24 * 60 * 60 * 1000);
    const prevIso = prevDate.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("masjid_prayer_times")
      .select("*")
      .eq("masjid_id", selectedMasjidId)
      .eq("date", prevIso)
      .order("prayer", { ascending: true });

    if (error || !data || data.length === 0) {
      setMessage("No prayer times found for the previous day to copy from.");
      setMessageType("error");
      return;
    }

    const existing = data as PrayerTimeDbRow[];
    const map = new Map<PrayerKey, { start: string; jamaat: string }>();

    for (const row of existing) {
      map.set(row.prayer, {
        start: row.start_time.slice(0, 5),
        jamaat: row.jamaat_time.slice(0, 5),
      });
    }

    setRows((prev) =>
      prev.map((r) => {
        const fromPrev = map.get(r.prayer);
        if (!fromPrev) return r;
        return {
          ...r,
          start_time: fromPrev.start,
          jamaat_time: fromPrev.jamaat,
        };
      })
    );
    setMessage(
      `Copied times from ${prevIso} into the current day (not yet saved).`
    );
    setMessageType("success");
    setDirty(true);
  };

  const handleChangeDateBy = (deltaDays: number) => {
    setMessage(null);
    setMessageType(null);
    setDirty(false);
    setSelectedDate((prev) => {
      if (!prev) return getTodayIsoRome();
      const d = new Date(prev);
      if (Number.isNaN(d.getTime())) return getTodayIsoRome();
      d.setDate(d.getDate() + deltaDays);
      return d.toISOString().slice(0, 10);
    });
  };

  const handleGoToday = () => {
    setMessage(null);
    setMessageType(null);
    setDirty(false);
    setSelectedDate(getTodayIsoRome());
  };

  const handleClearAllLocal = () => {
    if (!selectedMasjidId || !selectedDate) return;
    setRows(buildEmptyRows(selectedMasjidId, selectedDate));
    setMessage("All times cleared locally. Click Save to apply.");
    setMessageType("success");
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedMasjidId || !selectedDate) return;

    // validate: either both empty or both filled
    for (const r of rows) {
      if ((r.start_time && !r.jamaat_time) || (!r.start_time && r.jamaat_time)) {
        setMessage(
          `For ${r.prayer.toUpperCase()} you must set both start and jamā‘ah, or leave both empty.`
        );
        setMessageType("error");
        return;
      }
    }

    const toSave = rows.filter((r) => r.start_time && r.jamaat_time);

    setSaving(true);
    setMessage(null);
    setMessageType(null);

    try {
      if (toSave.length === 0) {
        // If everything is cleared, delete rows for that day
        const { error } = await supabase
          .from("masjid_prayer_times")
          .delete()
          .eq("masjid_id", selectedMasjidId)
          .eq("date", selectedDate);

        if (error) {
          console.error("Error deleting masjid_prayer_times", error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          setMessage("All prayer times cleared for this day.");
          setMessageType("success");
          setRows(buildEmptyRows(selectedMasjidId, selectedDate));
          setDirty(false);
          setLastSavedAt(
            new Date().toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } else {
        // IMPORTANT: do NOT send 'id' at all, let Postgres bigserial generate it
        const payload = toSave.map((r) => ({
          masjid_id: r.masjid_id,
          date: r.date,
          prayer: r.prayer,
          start_time: `${r.start_time}:00`,
          jamaat_time: `${r.jamaat_time}:00`,
        }));

        const { error } = await supabase
          .from("masjid_prayer_times")
          .upsert(payload, { onConflict: "masjid_id,date,prayer" });

        if (error) {
          console.error("Error upserting masjid_prayer_times", error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          await loadPrayerTimes(selectedMasjidId, selectedDate);
          setMessage("Prayer times saved for this day.");
          setMessageType("success");
          setDirty(false);
          setLastSavedAt(
            new Date().toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Daily prayer times (start & jamā‘ah)
          </h2>
          <p className="text-xs text-slate-400">
            Set official masjid times for Fajr, Dhuhr, Asr, Maghrib and Isha.
            The mobile app will read these as the source of truth.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:items-end text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Masjid:</span>
            <select
              className="text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
              value={selectedMasjidId ?? ""}
              onChange={(e) => {
                setSelectedMasjidId(e.target.value || null);
                setMessage(null);
                setMessageType(null);
                setDirty(false);
              }}
              disabled={loadingMasjids}
            >
              {masjids.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.official_name} ({m.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Date:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleChangeDateBy(-1)}
                className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-[11px] text-slate-200 hover:bg-slate-800"
              >
                ◀
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setMessage(null);
                  setMessageType(null);
                  setDirty(false);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
              <button
                type="button"
                onClick={() => handleChangeDateBy(1)}
                className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-[11px] text-slate-200 hover:bg-slate-800"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="ml-2 px-3 py-1 rounded-full border border-emerald-500/70 text-[11px] text-emerald-300 hover:bg-emerald-500/10"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message + status line */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {message && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs max-w-xl ${
              messageType === "success"
                ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/70 bg-red-500/10 text-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {dirty && (
            <span className="inline-flex items-center px-2 py-1 rounded-full border border-amber-400/60 bg-amber-500/10 text-amber-200">
              ● Unsaved changes
            </span>
          )}
          {lastSavedAt && !dirty && (
            <span className="text-slate-500">
              Last saved at{" "}
              <span className="text-slate-300 font-medium">
                {lastSavedAt}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="text-slate-400">
            {selectedMasjid ? (
              <>
                Editing{" "}
                <span className="text-slate-100 font-medium">
                  {selectedMasjid.official_name}
                </span>{" "}
                on <span className="text-slate-100">{selectedDate}</span>
              </>
            ) : (
              "Select a masjid to start."
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopyFromPreviousDay()}
              disabled={!selectedMasjidId || !selectedDate || loadingPrayers}
              className="text-[11px] px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 disabled:opacity-50"
            >
              Copy from previous day
            </button>
            <button
              type="button"
              onClick={handleClearAllLocal}
              disabled={!selectedMasjidId || rows.length === 0}
              className="text-[11px] px-3 py-1.5 rounded-full border border-red-500/70 bg-red-500/5 text-red-200 hover:bg-red-500/20 disabled:opacity-40"
            >
              Clear all (this day)
            </button>
          </div>
        </div>

        {loadingPrayers ? (
          <div className="text-xs text-slate-400">Loading prayer times…</div>
        ) : rows.length === 0 ? (
          <div className="text-xs text-slate-400">
            No prayers to show. Select a masjid and date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {rows.map((row) => {
              const label = PRAYERS.find((p) => p.key === row.prayer)?.label;
              return (
                <div
                  key={row.prayer}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-semibold">
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {row.prayer.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-400">
                      Start (adhan)
                    </label>
                    <input
                      type="time"
                      value={row.start_time}
                      onChange={(e) =>
                        updateRow(row.prayer, { start_time: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-400">
                      Jamā‘ah (iqamah)
                    </label>
                    <input
                      type="time"
                      value={row.jamaat_time}
                      onChange={(e) =>
                        updateRow(row.prayer, {
                          jamaat_time: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedMasjidId}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-emerald-950 text-xs font-semibold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save prayer times"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimesPage;
