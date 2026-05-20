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
  asr_start_time_shafi: string; // HH:MM
  asr_start_time_hanafi: string; // HH:MM
  jamaat_time: string; // HH:MM
};

type PrayerTimeDbRow = {
  id: number;
  masjid_id: string;
  date: string;
  prayer: PrayerKey;
  start_time: string | null; // "HH:MM:SS"
  asr_start_time_shafi: string | null; // "HH:MM:SS"
  asr_start_time_hanafi: string | null; // "HH:MM:SS"
  jamaat_time: string | null; // "HH:MM:SS"
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
  const [savingAdhan, setSavingAdhan] = useState(false);
  const [savingJamaat, setSavingJamaat] = useState(false);
  const [applyingCityAdhan, setApplyingCityAdhan] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [selectedCityMasjidIds, setSelectedCityMasjidIds] = useState<string[]>(
    []
  );

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === selectedMasjidId) ?? null,
    [masjids, selectedMasjidId]
  );

  const sameCityMasjids = useMemo(() => {
    if (!selectedMasjid) return [];
    return masjids.filter(
      (m) => m.city === selectedMasjid.city && m.id !== selectedMasjid.id
    );
  }, [masjids, selectedMasjid]);

  useEffect(() => {
    setSelectedCityMasjidIds([]);
  }, [selectedMasjidId, selectedDate]);

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
      asr_start_time_shafi: "",
      asr_start_time_hanafi: "",
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
          start_time:
            row.prayer === "asr"
              ? row.start_time?.slice(0, 5) ??
                row.asr_start_time_shafi?.slice(0, 5) ??
                row.asr_start_time_hanafi?.slice(0, 5) ??
                ""
              : row.start_time?.slice(0, 5) ?? "", // HH:MM:SS -> HH:MM
          asr_start_time_shafi: row.asr_start_time_shafi?.slice(0, 5) ?? "",
          asr_start_time_hanafi: row.asr_start_time_hanafi?.slice(0, 5) ?? "",
          jamaat_time: row.jamaat_time?.slice(0, 5) ?? "",
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
          asr_start_time_shafi: "",
          asr_start_time_hanafi: "",
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
    patch: Partial<
      Pick<
        PrayerRow,
        | "start_time"
        | "asr_start_time_shafi"
        | "asr_start_time_hanafi"
        | "jamaat_time"
      >
    >
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.prayer === prayerKey ? { ...r, ...patch } : r))
    );
    setMessage(null);
    setMessageType(null);
    setDirty(true);
  };

  const buildAsrTimingPayload = (
    row: Pick<
      PrayerRow,
      "start_time" | "asr_start_time_shafi" | "asr_start_time_hanafi"
    >
  ) => ({
    start_time:
      row.asr_start_time_shafi || row.asr_start_time_hanafi || row.start_time
        ? `${
            row.asr_start_time_shafi ||
            row.asr_start_time_hanafi ||
            row.start_time
          }:00`
        : null,
    asr_start_time_shafi: row.asr_start_time_shafi
      ? `${row.asr_start_time_shafi}:00`
      : null,
    asr_start_time_hanafi: row.asr_start_time_hanafi
      ? `${row.asr_start_time_hanafi}:00`
      : null,
  });

  const handleCopyFromPreviousDay = async (mode: "both" | "jamaat") => {
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
    const map = new Map<
      PrayerKey,
      { start: string; asrShafi: string; asrHanafi: string; jamaat: string }
    >();

    for (const row of existing) {
      map.set(row.prayer, {
        start: row.start_time?.slice(0, 5) ?? "",
        asrShafi: row.asr_start_time_shafi?.slice(0, 5) ?? "",
        asrHanafi: row.asr_start_time_hanafi?.slice(0, 5) ?? "",
        jamaat: row.jamaat_time?.slice(0, 5) ?? "",
      });
    }

    setRows((prev) =>
      prev.map((r) => {
        const fromPrev = map.get(r.prayer);
        if (!fromPrev) return r;
        return {
          ...r,
          start_time: mode === "both" ? fromPrev.start : r.start_time,
          asr_start_time_shafi:
            mode === "both" ? fromPrev.asrShafi : r.asr_start_time_shafi,
          asr_start_time_hanafi:
            mode === "both" ? fromPrev.asrHanafi : r.asr_start_time_hanafi,
          jamaat_time: fromPrev.jamaat,
        };
      })
    );
    setMessage(
      mode === "both"
        ? `Copied adhan and jamā‘ah times from ${prevIso} into the current day (not yet saved).`
        : `Copied jamā‘ah times from ${prevIso} into the current day (not yet saved).`
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

  const handleSave = async (
    field: "start_time" | "jamaat_time",
    setSaving: React.Dispatch<React.SetStateAction<boolean>>,
    successLabel: string
  ) => {
    if (!selectedMasjidId || !selectedDate) return;

    const toSave =
      field === "start_time"
        ? rows
            .filter((r) =>
              r.prayer === "asr"
                ? Boolean(r.asr_start_time_shafi || r.asr_start_time_hanafi)
                : Boolean(r.start_time)
            )
            .map((r) => ({
              masjid_id: r.masjid_id,
              date: r.date,
              prayer: r.prayer,
              start_time:
                r.prayer === "asr"
                  ? `${
                      r.asr_start_time_shafi || r.asr_start_time_hanafi || ""
                    }:00`
                  : `${r.start_time}:00`,
              asr_start_time_shafi: r.asr_start_time_shafi
                ? `${r.asr_start_time_shafi}:00`
                : null,
              asr_start_time_hanafi: r.asr_start_time_hanafi
                ? `${r.asr_start_time_hanafi}:00`
                : null,
            }))
        : rows
            .filter((r) => Boolean(r[field]))
            .map((r) => ({
              masjid_id: r.masjid_id,
              date: r.date,
              prayer: r.prayer,
              [field]: `${r[field]}:00`,
              ...(r.prayer === "asr"
                ? buildAsrTimingPayload(r)
                : {
                    start_time: r.start_time ? `${r.start_time}:00` : null,
                    asr_start_time_shafi: null,
                    asr_start_time_hanafi: null,
                  }),
            }));

    setSaving(true);
    setMessage(null);
    setMessageType(null);

    try {
      if (toSave.length === 0) {
        const { error } = await supabase
          .from("masjid_prayer_times")
          .update(
            field === "start_time"
              ? {
                  start_time: null,
                  asr_start_time_shafi: null,
                  asr_start_time_hanafi: null,
                }
              : { [field]: null }
          )
          .eq("masjid_id", selectedMasjidId)
          .eq("date", selectedDate);

        if (error) {
          console.error(`Error clearing ${field}`, error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          setMessage(`${successLabel} cleared for this day.`);
          setMessageType("success");
          setRows((prev) =>
            prev.map((r) => ({
              ...r,
              [field]: "",
              ...(field === "start_time"
                ? {
                    asr_start_time_shafi: "",
                    asr_start_time_hanafi: "",
                  }
                : {}),
            }))
          );
          setDirty(false);
          setLastSavedAt(
            new Date().toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } else {
        const { error } = await supabase
          .from("masjid_prayer_times")
          .upsert(toSave, {
            onConflict: "masjid_id,date,prayer",
          });

        if (error) {
          console.error(`Error saving ${field}`, error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          await loadPrayerTimes(selectedMasjidId, selectedDate);
          setMessage(`${successLabel} saved for this day.`);
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

  const handleToggleCityMasjid = (masjidId: string) => {
    setSelectedCityMasjidIds((prev) =>
      prev.includes(masjidId)
        ? prev.filter((id) => id !== masjidId)
        : [...prev, masjidId]
    );
  };

  const handleApplyAdhanToSameCity = async () => {
    if (!selectedDate || selectedCityMasjidIds.length === 0) return;

    const adhanRows = rows.filter(
      (r) =>
        (r.prayer === "asr" &&
          (r.asr_start_time_shafi || r.asr_start_time_hanafi)) ||
        (r.prayer !== "asr" && r.start_time)
    );
    if (adhanRows.length === 0) {
      setMessage("Set at least one adhan start time before applying to a city.");
      setMessageType("error");
      return;
    }

    const payload = selectedCityMasjidIds.flatMap((masjidId) =>
      adhanRows.map((row) => ({
        masjid_id: masjidId,
        date: selectedDate,
        prayer: row.prayer,
        ...(row.prayer === "asr"
          ? buildAsrTimingPayload(row)
          : {
              start_time: `${row.start_time}:00`,
              asr_start_time_shafi: null,
              asr_start_time_hanafi: null,
            }),
      }))
    );

    setApplyingCityAdhan(true);
    setMessage(null);
    setMessageType(null);

    const { error } = await supabase.from("masjid_prayer_times").upsert(
      payload,
      {
        onConflict: "masjid_id,date,prayer",
      }
    );

    setApplyingCityAdhan(false);

    if (error) {
      console.error("Error applying adhan times to same-city masjids", error);
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    setMessage(
      `Adhan times applied to ${selectedCityMasjidIds.length} selected masjid(s) in ${selectedMasjid?.city}.`
    );
    setMessageType("success");
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
            Daily prayer times (adhan & jamā‘ah)
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
              onClick={() => void handleCopyFromPreviousDay("both")}
              disabled={!selectedMasjidId || !selectedDate || loadingPrayers}
              className="text-[11px] px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 disabled:opacity-50"
            >
              Copy from previous day
            </button>
            <button
              type="button"
              onClick={() => void handleCopyFromPreviousDay("jamaat")}
              disabled={!selectedMasjidId || !selectedDate || loadingPrayers}
              className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/5 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Copy jamā‘ah only
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

        {selectedMasjid && sameCityMasjids.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 space-y-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-slate-100">
                Apply adhan times to other masjids in {selectedMasjid.city}
              </p>
              <p className="text-[11px] text-slate-400">
                This copies only <span className="text-slate-200">Start (adhan)</span>{" "}
                times for this date. Jamā‘ah times are not changed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {sameCityMasjids.map((masjid) => {
                const checked = selectedCityMasjidIds.includes(masjid.id);
                return (
                  <label
                    key={masjid.id}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] cursor-pointer ${
                      checked
                        ? "border-sky-400/70 bg-sky-500/15 text-sky-100"
                        : "border-slate-700 bg-slate-900 text-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleCityMasjid(masjid.id)}
                      className="accent-sky-500"
                    />
                    {masjid.official_name}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setSelectedCityMasjidIds((prev) =>
                    prev.length === sameCityMasjids.length
                      ? []
                      : sameCityMasjids.map((m) => m.id)
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                {selectedCityMasjidIds.length === sameCityMasjids.length
                  ? "Unselect all"
                  : "Select all"}
              </button>

              <button
                type="button"
                onClick={() => void handleApplyAdhanToSameCity()}
                disabled={
                  applyingCityAdhan ||
                  selectedCityMasjidIds.length === 0 ||
                  !selectedDate
                }
                className="text-[11px] px-3 py-1.5 rounded-full border border-sky-500/70 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20 disabled:opacity-50"
              >
                {applyingCityAdhan
                  ? "Applying adhan…"
                  : "Apply adhan to selected masjids"}
              </button>
            </div>
          </div>
        )}

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

                  {row.prayer === "asr" ? (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-slate-400">
                          Start (adhan) — Shafi
                        </label>
                        <input
                          type="time"
                          value={row.asr_start_time_shafi}
                          onChange={(e) =>
                            updateRow(row.prayer, {
                              asr_start_time_shafi: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-slate-400">
                          Start (adhan) — Hanafi
                        </label>
                        <input
                          type="time"
                          value={row.asr_start_time_hanafi}
                          onChange={(e) =>
                            updateRow(row.prayer, {
                              asr_start_time_hanafi: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}

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
            onClick={() =>
              void handleSave("start_time", setSavingAdhan, "Adhan times")
            }
            disabled={savingAdhan || savingJamaat || !selectedMasjidId}
            className="px-4 py-2 rounded-lg bg-sky-500 text-sky-950 text-xs font-semibold disabled:opacity-60"
          >
            {savingAdhan ? "Saving…" : "Save adhan times"}
          </button>
          <button
            type="button"
            onClick={() =>
              void handleSave("jamaat_time", setSavingJamaat, "Jamā‘ah times")
            }
            disabled={savingAdhan || savingJamaat || !selectedMasjidId}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-emerald-950 text-xs font-semibold disabled:opacity-60"
          >
            {savingJamaat ? "Saving…" : "Save jamā‘ah times"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimesPage;
