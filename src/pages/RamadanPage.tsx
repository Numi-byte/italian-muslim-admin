// src/pages/RamadanPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type RamadanSettings = {
  id: number;
  masjid_id: string;
  gregorian_year: number;
  hijri_year: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  booking_start: string | null;
  booking_end: string | null;
};

type RamadanDay = {
  id: number;
  ramadan_id: number;
  masjid_id: string;
  day_number: number;
  date: string;
  is_open_for_requests: boolean;
  approved_request_id: number | null;
};

type DayAgg = {
  day_id: number;
  total_requests: number;
  approved_requests: number;
};

const TARGET_YEAR = 2026;

const RamadanPage: React.FC = () => {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);

  const [ramadan, setRamadan] = useState<RamadanSettings | null>(null);
  const [ramadanLoading, setRamadanLoading] = useState(false);
  const [ramadanError, setRamadanError] = useState<string | null>(null);

  const [days, setDays] = useState<RamadanDay[]>([]);
  const [dayAggs, setDayAggs] = useState<DayAgg[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);

  const [savingSettings, setSavingSettings] = useState(false);
  const [generatingDays, setGeneratingDays] = useState(false);
  const [updatingDay, setUpdatingDay] = useState<number | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<Partial<RamadanSettings>>({
    gregorian_year: TARGET_YEAR,
    is_active: true,
  });

  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsMessageType, setSettingsMessageType] = useState<
    "success" | "error" | null
  >(null);

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === selectedMasjidId) ?? null,
    [masjids, selectedMasjidId]
  );

  const aggByDayId = useMemo(() => {
    const map = new Map<number, DayAgg>();
    for (const a of dayAggs) map.set(a.day_id, a);
    return map;
  }, [dayAggs]);

  // Derived: day count from draft dates (even before saving)
  const draftDayCount = useMemo(() => {
    if (!settingsDraft.start_date || !settingsDraft.end_date) return null;
    const start = new Date(settingsDraft.start_date);
    const end = new Date(settingsDraft.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return null;
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  }, [settingsDraft.start_date, settingsDraft.end_date]);

  // ---------------------------------------------------------------------------
  // Load masjids
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadMasjids = async () => {
      const { data, error } = await supabase
        .from("public_masjids")
        .select("id, official_name, city")
        .order("city", { ascending: true });

      if (error) {
        console.error("Error loading masjids", error);
        setMasjids([]);
      } else {
        setMasjids(data ?? []);
        if (data && data.length > 0) {
          setSelectedMasjidId((prev) => prev ?? data[0].id);
        }
      }
    };

    void loadMasjids();
  }, []);

  // ---------------------------------------------------------------------------
  // Load Ramadan settings for selected masjid & TARGET_YEAR
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadRamadan = async () => {
      if (!selectedMasjidId) {
        setRamadan(null);
        setSettingsDraft({ gregorian_year: TARGET_YEAR, is_active: true });
        setDays([]);
        setDayAggs([]);
        return;
      }

      setRamadanLoading(true);
      setRamadanError(null);
      setSettingsMessage(null);
      setSettingsMessageType(null);

      const { data, error } = await supabase
        .from("ramadan_settings")
        .select("*")
        .eq("masjid_id", selectedMasjidId)
        .eq("gregorian_year", TARGET_YEAR)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading ramadan_settings", error);
        setRamadan(null);
        setSettingsDraft({ gregorian_year: TARGET_YEAR, is_active: true });
        setRamadanError(error.message);
        setDays([]);
        setDayAggs([]);
      } else if (!data) {
        setRamadan(null);
        setSettingsDraft({ gregorian_year: TARGET_YEAR, is_active: true });
        setDays([]);
        setDayAggs([]);
      } else {
        setRamadan(data as RamadanSettings);
        setSettingsDraft(data as RamadanSettings);
      }

      setRamadanLoading(false);
    };

    void loadRamadan();
  }, [selectedMasjidId]);

  // ---------------------------------------------------------------------------
  // Load days + aggregates when Ramadan exists
  // ---------------------------------------------------------------------------
  const loadDaysAndAggs = async (r: RamadanSettings | null) => {
    if (!r) {
      setDays([]);
      setDayAggs([]);
      return;
    }

    setDaysLoading(true);

    const { data: dayRows, error: dayError } = await supabase
      .from("ramadan_iftar_days")
      .select("*")
      .eq("ramadan_id", r.id)
      .order("day_number", { ascending: true });

    if (dayError) {
      console.error("Error loading ramadan_iftar_days", dayError);
      setDays([]);
    } else {
      setDays(dayRows ?? []);
    }

    const { data: aggRows, error: aggError } = await supabase
      .from("iftar_requests")
      .select("ramadan_day_id, status")
      .eq("ramadan_id", r.id);

    if (aggError) {
      console.error("Error loading iftar_requests", aggError);
      setDayAggs([]);
    } else {
      const aggMap = new Map<number, DayAgg>();
      for (const row of aggRows ?? []) {
        const dayId = row.ramadan_day_id as number;
        if (!aggMap.has(dayId)) {
          aggMap.set(dayId, {
            day_id: dayId,
            total_requests: 0,
            approved_requests: 0,
          });
        }
        const agg = aggMap.get(dayId)!;
        agg.total_requests += 1;
        if (row.status === "approved") {
          agg.approved_requests += 1;
        }
      }
      setDayAggs([...aggMap.values()]);
    }

    setDaysLoading(false);
  };

  useEffect(() => {
    void loadDaysAndAggs(ramadan);
  }, [ramadan]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const updateSettingsDraft = (patch: Partial<RamadanSettings>) => {
    setSettingsDraft((prev) => ({ ...prev, ...patch }));
    setSettingsMessage(null);
    setSettingsMessageType(null);
  };

  const fillEstimatedRamadan2026 = () => {
    // rough guess; you can adjust later
    updateSettingsDraft({
      start_date: "2026-02-28",
      end_date: "2026-03-29",
    });
  };

  const setBookingWindowFromNowToStart = () => {
    if (!settingsDraft.start_date) return;
    const start = new Date(settingsDraft.start_date);
    const now = new Date();

    updateSettingsDraft({
      booking_start: now.toISOString(),
      booking_end: new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  // Central: generate all days for a given Ramadan (delete + insert)
  const generateDaysFor = async (r: RamadanSettings) => {
    const start = new Date(r.start_date);
    const end = new Date(r.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      setSettingsMessage("Invalid start/end dates in saved settings.");
      setSettingsMessageType("error");
      return;
    }

    const daysToInsert: {
      ramadan_id: number;
      masjid_id: string;
      day_number: number;
      date: string;
    }[] = [];

    let dayNum = 1;
    for (
      let d = new Date(start);
      d <= end;
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const iso = d.toISOString().slice(0, 10);
      daysToInsert.push({
        ramadan_id: r.id,
        masjid_id: r.masjid_id,
        day_number: dayNum,
        date: iso,
      });
      dayNum++;
    }

    setGeneratingDays(true);
    try {
      // Clear previous calendar for this Ramadan (avoids onConflict issues)
      const { error: delError } = await supabase
        .from("ramadan_iftar_days")
        .delete()
        .eq("ramadan_id", r.id);

      if (delError) {
        console.error("Error deleting old ramadan_iftar_days", delError);
        setSettingsMessage(delError.message);
        setSettingsMessageType("error");
        return;
      }

      const { error: insError } = await supabase
        .from("ramadan_iftar_days")
        .insert(daysToInsert);

      if (insError) {
        console.error("Error inserting ramadan_iftar_days", insError);
        setSettingsMessage(insError.message);
        setSettingsMessageType("error");
        return;
      }

      await loadDaysAndAggs(r);
      setSettingsMessage("Ramadan days regenerated from the saved schedule.");
      setSettingsMessageType("success");
    } finally {
      setGeneratingDays(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Save settings (now also regenerates days)
  // ---------------------------------------------------------------------------
  const handleSaveSettings = async () => {
    if (!selectedMasjidId) return;

    setSettingsMessage(null);
    setSettingsMessageType(null);

    if (!settingsDraft.start_date || !settingsDraft.end_date) {
      setSettingsMessage("Please set both start and end date for Ramadan.");
      setSettingsMessageType("error");
      return;
    }

    const start = new Date(settingsDraft.start_date);
    const end = new Date(settingsDraft.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      setSettingsMessage("Start date must be before or equal to end date.");
      setSettingsMessageType("error");
      return;
    }

    setSavingSettings(true);
    try {
      if (!ramadan) {
        const { data, error } = await supabase
          .from("ramadan_settings")
          .insert({
            masjid_id: selectedMasjidId,
            gregorian_year: TARGET_YEAR,
            hijri_year: settingsDraft.hijri_year ?? null,
            start_date: settingsDraft.start_date,
            end_date: settingsDraft.end_date,
            is_active: settingsDraft.is_active ?? true,
            booking_start: settingsDraft.booking_start,
            booking_end: settingsDraft.booking_end,
          })
          .select("*")
          .single();

        if (error || !data) {
          console.error("Error inserting ramadan_settings", error);
          setSettingsMessage(error?.message ?? "Failed to save settings.");
          setSettingsMessageType("error");
        } else {
          const newR = data as RamadanSettings;
          setRamadan(newR);
          setSettingsDraft(newR);
          await generateDaysFor(newR);
        }
      } else {
        const { data, error } = await supabase
          .from("ramadan_settings")
          .update({
            hijri_year: settingsDraft.hijri_year ?? null,
            start_date: settingsDraft.start_date,
            end_date: settingsDraft.end_date,
            is_active: settingsDraft.is_active ?? true,
            booking_start: settingsDraft.booking_start,
            booking_end: settingsDraft.booking_end,
          })
          .eq("id", ramadan.id)
          .select("*")
          .single();

        if (error || !data) {
          console.error("Error updating ramadan_settings", error);
          setSettingsMessage(error?.message ?? "Failed to save settings.");
          setSettingsMessageType("error");
        } else {
          const newR = data as RamadanSettings;
          setRamadan(newR);
          setSettingsDraft(newR);
          await generateDaysFor(newR);
        }
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleDayOpen = async (day: RamadanDay) => {
    setUpdatingDay(day.id);
    try {
      const { data, error } = await supabase
        .from("ramadan_iftar_days")
        .update({ is_open_for_requests: !day.is_open_for_requests })
        .eq("id", day.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating ramadan_iftar_days row", error);
        setSettingsMessage(error.message);
        setSettingsMessageType("error");
      } else {
        setDays((prev) =>
          prev.map((d) => (d.id === day.id ? (data as RamadanDay) : d))
        );
      }
    } finally {
      setUpdatingDay(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------
  const renderDayStatus = (day: RamadanDay) => {
    const agg = aggByDayId.get(day.id);

    if (!day.is_open_for_requests) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-200">
          Closed
        </span>
      );
    }

    if (!agg || agg.total_requests === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300">
          Available
        </span>
      );
    }

    if (agg.approved_requests > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-emerald-950 font-medium">
          Approved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-medium">
        Taken (pending)
      </span>
    );
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
            Ramadan {TARGET_YEAR} configuration
          </h2>
          <p className="text-xs text-slate-400">
            Select a masjid, define Ramadan dates and booking window. Saving
            will regenerate the sponsorship calendar automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">Masjid:</div>
          <select
            className="text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
            value={selectedMasjidId ?? ""}
            onChange={(e) => setSelectedMasjidId(e.target.value || null)}
          >
            {masjids.map((m) => (
              <option key={m.id} value={m.id}>
                {m.official_name} ({m.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message */}
      {settingsMessage && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            settingsMessageType === "success"
              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/70 bg-red-500/10 text-red-200"
          }`}
        >
          {settingsMessage}
        </div>
      )}

      {/* Settings + summary */}
      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)] gap-6">
        {/* Settings card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">
              Ramadan settings
            </h3>
            {ramadanLoading && (
              <span className="text-xs text-slate-400">Loading…</span>
            )}
          </div>

          {ramadanError && (
            <p className="text-xs text-red-300">{ramadanError}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <label className="block text-slate-300">Gregorian year</label>
              <input
                type="number"
                value={settingsDraft.gregorian_year ?? TARGET_YEAR}
                disabled
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300">
                Hijri year (optional)
              </label>
              <input
                type="number"
                value={settingsDraft.hijri_year ?? ""}
                onChange={(e) =>
                  updateSettingsDraft({
                    hijri_year: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300">Start date</label>
                <button
                  type="button"
                  className="text-[10px] text-emerald-300 underline"
                  onClick={fillEstimatedRamadan2026}
                >
                  Guess 2026 Ramadan
                </button>
              </div>
              <input
                type="date"
                value={settingsDraft.start_date ?? ""}
                onChange={(e) =>
                  updateSettingsDraft({ start_date: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300">End date</label>
              <input
                type="date"
                value={settingsDraft.end_date ?? ""}
                onChange={(e) =>
                  updateSettingsDraft({ end_date: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300">
                  Booking start (optional)
                </label>
                <button
                  type="button"
                  className="text-[10px] text-emerald-300 underline"
                  onClick={setBookingWindowFromNowToStart}
                  disabled={!settingsDraft.start_date}
                >
                  From now → before Ramadan
                </button>
              </div>
              <input
                type="datetime-local"
                value={
                  settingsDraft.booking_start
                    ? settingsDraft.booking_start.slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  updateSettingsDraft({
                    booking_start: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300">
                Booking end (optional)
              </label>
              <input
                type="datetime-local"
                value={
                  settingsDraft.booking_end
                    ? settingsDraft.booking_end.slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  updateSettingsDraft({
                    booking_end: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={settingsDraft.is_active ?? true}
                onChange={(e) =>
                  updateSettingsDraft({ is_active: e.target.checked })
                }
                className="rounded border-slate-600 bg-slate-900 text-emerald-500"
              />
              Ramadan is active
            </label>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings || !selectedMasjid}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-emerald-950 text-xs font-semibold disabled:opacity-60"
            >
              {savingSettings ? "Saving…" : "Save & regenerate calendar"}
            </button>
          </div>
        </div>

        {/* Summary card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-slate-100">
            Calendar & booking summary
          </h3>
          <p className="text-slate-400">
            Check that your dates and generated calendar look sensible. The
            mobile app will use this to decide which days can be requested.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col">
              <span className="text-slate-400">Draft day count</span>
              <span
                className={`text-base font-semibold ${
                  draftDayCount === 29 || draftDayCount === 30
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {draftDayCount ?? "—"}
              </span>
              <span className="text-[11px] text-slate-500">
                Expected: 29 or 30 days. It’s okay if the real moon sighting
                shifts by a day.
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-slate-400">Generated days</span>
              <span className="text-base text-slate-100 font-semibold">
                {days.length || "—"}
              </span>
              <span className="text-[11px] text-slate-500">
                Calendar is always regenerated from the latest saved dates.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => ramadan && void generateDaysFor(ramadan)}
            disabled={generatingDays || !ramadan}
            className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium disabled:opacity-60"
          >
            {generatingDays ? "Regenerating days…" : "Regenerate days from dates"}
          </button>
        </div>
      </div>

      {/* Legend + day cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-200">Ramadan days</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
            Available
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
            Taken (pending)
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500 text-emerald-950">
            Approved
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
            Closed
          </span>
        </div>

        {daysLoading ? (
          <div className="text-xs text-slate-400">Loading calendar…</div>
        ) : days.length === 0 ? (
          <div className="text-xs text-slate-400">
            No calendar generated yet. Save settings to create the Ramadan
            calendar for this masjid.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
            {days.map((day) => {
              const agg = aggByDayId.get(day.id);
              const dateLabel = new Date(day.date).toLocaleDateString(
                "it-IT",
                {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                }
              );

              return (
                <div
                  key={day.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">
                        Day {day.day_number}
                      </div>
                      <div className="text-xs text-slate-100">
                        {dateLabel}
                      </div>
                    </div>
                    {renderDayStatus(day)}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Requests:{" "}
                    <span className="text-slate-200">
                      {agg?.total_requests ?? 0}
                    </span>
                    {agg && agg.approved_requests > 0 && (
                      <span className="text-emerald-300">
                        {" "}
                        • {agg.approved_requests} approved
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleToggleDayOpen(day)}
                      disabled={updatingDay === day.id}
                      className={`px-2.5 py-1 rounded-full border text-[11px] ${
                        day.is_open_for_requests
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-300"
                          : "bg-slate-800 border-slate-600 text-slate-300"
                      } disabled:opacity-60`}
                    >
                      {updatingDay === day.id
                        ? "Updating…"
                        : day.is_open_for_requests
                        ? "Open"
                        : "Closed"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RamadanPage;
